const HEADER_MAP = 403;
const HEADER_LIST = 303;

class RbWriter {
    constructor() {
        this.buffer = new Uint8Array(1024 * 1024); // 1MB Buffer
        this.view = new DataView(this.buffer.buffer);
        this.offset = 0;
    }

    ensureSize(n) {
        if (this.offset + n >= this.buffer.length) {
            const newBuf = new Uint8Array(this.buffer.length * 2);
            newBuf.set(this.buffer);
            this.buffer = newBuf;
            this.view = new DataView(this.buffer.buffer);
        }
    }

    writeInt(val) {
        this.ensureSize(4);
        this.view.setInt32(this.offset, val, true);
        this.offset += 4;
    }

    writeDouble(val) {
        this.ensureSize(8);
        this.view.setFloat64(this.offset, val, true);
        this.offset += 8;
    }

    writeString(str) {
        const bytes = new TextEncoder().encode(str);
        this.writeInt(bytes.length);
        this.ensureSize(bytes.length);
        this.buffer.set(bytes, this.offset);
        this.offset += bytes.length;
    }

    writeVal(val) {
        if (typeof val === 'string') {
            this.writeInt(1); // Type String
            this.writeString(val);
        } else if (typeof val === 'number') {
            this.writeInt(0); // Type Double
            this.writeDouble(val);
        } else if (Array.isArray(val)) {
            const hex = encodeHexBlob(val);
            this.writeInt(1); // Nested lists act as Strings
            this.writeString(hex);
        } else if (typeof val === 'object' && val !== null) {
            const hex = encodeHexBlob(val);
            this.writeInt(1); // Nested objects act as Strings
            this.writeString(hex);
        } else {
            this.writeInt(0);
            this.writeDouble(0);
        }
    }

    getHex() {
        const sub = this.buffer.subarray(0, this.offset);
        return Array.from(sub)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase();
    }
}

export function encodeHexBlob(data) {
    const writer = new RbWriter();

    if (Array.isArray(data)) {
        writer.writeInt(HEADER_LIST);
        writer.writeInt(data.length);
        for (const item of data) {
            writer.writeVal(item);
        }
    } else if (typeof data === 'object' && data !== null) {
        writer.writeInt(HEADER_MAP);
        const keys = Object.keys(data).filter(k => !k.startsWith('__'));
        writer.writeInt(keys.length);
        for (const key of keys) {
            // FIX 1: Keys must be Type 1 (String), not 0 (Double)
            writer.writeInt(1); 
            writer.writeString(key);
            writer.writeVal(data[key]);
        }
    }

    return writer.getHex();
}

export function jsonToIni(json) {
    let ini = "[savegame]\r\n";
    
    // FIX 2: Sort keys so roster items (roster_0, roster_1) stay together
    const sortedKeys = Object.keys(json).sort();

    for (const key of sortedKeys) {
        if (key.startsWith('__')) continue;
        const val = json[key];

        // FIX 3: Handle Arrays by splitting them into key_0, key_1...
        if (Array.isArray(val)) {
            ini += `${key}="${val.length.toFixed(6)}"\r\n`;
            val.forEach((item, index) => {
                let itemVal = item;
                if (typeof item === 'object' && item !== null) {
                    itemVal = encodeHexBlob(item);
                } else if (typeof item === 'number') {
                    itemVal = item.toFixed(6);
                }
                ini += `${key}_${index}="${itemVal}"\r\n`;
            });
        } 
        // Handle Standard Objects/Values
        else {
            let outputVal = val;
            if (typeof val === 'object' && val !== null) {
                outputVal = encodeHexBlob(val);
            } else if (typeof val === 'number') {
                outputVal = val.toFixed(6);
            }
            ini += `${key}="${outputVal}"\r\n`;
        }
    }
    return ini;
}