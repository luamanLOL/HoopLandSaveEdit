// --- UTILS ---
const HEADER_MAP = 403; 
const HEADER_LIST = 303; 
const HEADER_GRID = 603; 

const hexToBytes = (hex) => {
    if (!hex || hex.length % 2 !== 0) return new Uint8Array([]);
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) bytes[i/2] = parseInt(hex.substr(i, 2), 16);
    return bytes;
};

// --- READER CLASS ---
class RbReader {
    constructor(bytes) {
        this.view = new DataView(bytes.buffer);
        this.offset = 0;
        this.length = bytes.length;
    }
    hasBytes(n) { return this.offset + n <= this.length; }
    
    readInt() { 
        if (!this.hasBytes(4)) throw new Error(`EOF reading Int`);
        const v = this.view.getInt32(this.offset, true); 
        this.offset += 4; 
        return v; 
    }
    
    readDouble() { 
        if (!this.hasBytes(8)) throw new Error(`EOF reading Double`);
        const v = this.view.getFloat64(this.offset, true); 
        this.offset += 8; 
        return v; 
    }
    
    readString() {
        const len = this.readInt();
        if(len < 0 || len > 5000000) throw new Error(`Invalid string length`);
        if (!this.hasBytes(len)) throw new Error(`EOF reading String`);
        const arr = new Uint8Array(this.view.buffer, this.view.byteOffset + this.offset, len);
        this.offset += len;
        return new TextDecoder().decode(arr);
    }
    
    readVal() {
        if (!this.hasBytes(4)) return "<EOF>";
        const type = this.readInt();
        
        if (type === 1) return detectAndDecode(this.readString()); // String
        if (type === 0) return this.readDouble(); // Double
        if (type === 13) return this.readDouble(); // Int
        
        // MiniMap
        if (type === 5) {
            const count = this.readInt();
            const obj = {};
            for(let i=0; i<count; i++) {
                const key = this.readString();
                const val = this.readVal();
                obj[key] = val;
            }
            return { __RB_TYPE: 'minimap', data: obj };
        }
        return this.readDouble(); // Fallback
    }
}

// --- CORE FUNCTIONS ---
export function detectAndDecode(str) {
    if (!str || str.length < 16 || !/^[0-9A-Fa-f]+$/.test(str)) return str;
    const h = str.substring(0, 8).toUpperCase();
    // Known Retro Bowl Headers
    if (h === '93010000' || h === '2F010000' || h === '5B020000') return decodeHexBlob(str);
    return str;
}

function decodeHexBlob(hexStr) {
    try {
        if (hexStr.length % 2 !== 0) return hexStr; // Invalid hex

        const bytes = hexToBytes(hexStr);
        const reader = new RbReader(bytes);

        if (!reader.hasBytes(8)) return hexStr;

        const header = reader.readInt();

        // MAP (403)
        if (header === HEADER_MAP) {
            const count = reader.readInt();
            const obj = {};
            for (let i = 0; i < count; i++) {
                try {
                    reader.readInt(); // Skip Key Type
                    const key = reader.readString();
                    const val = reader.readVal();
                    obj[key] = val;
                } catch (e) {
                    obj[`__ERR_${i}`] = `<DECODE_ERROR>`;
                    break; 
                }
            }
            return { __RB_TYPE: 'map', data: obj };
        }

        // LIST (303)
        if (header === HEADER_LIST) {
            const count = reader.readInt();
            const list = [];
            for (let i = 0; i < count; i++) {
                try { list.push(reader.readVal()); } 
                catch (e) { list.push(`<DECODE_ERROR>`); break; }
            }
            return { __RB_TYPE: 'list', data: list };
        }

        // GRID (603) - THE FIX IS HERE
        if (header === HEADER_GRID) {
            const w = reader.readInt();
            const h = reader.readInt();
            const total = w * h;
            const list = [];
            for (let i = 0; i < total; i++) {
                try {
                    list.push(reader.readDouble());
                } catch (e) {
                    // Stop reading grid if we hit EOF, but return what we have
                    console.warn("Grid Partial Read:", e);
                    list.push(0); 
                }
            }
            return { __RB_TYPE: 'grid', width: w, height: h, data: list };
        }

        return hexStr;
    } catch (e) {
        console.error("Hex Decode Failed:", e);
        return hexStr;
    }
}