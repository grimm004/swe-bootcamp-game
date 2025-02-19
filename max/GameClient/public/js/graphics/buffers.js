export class Buffer {
    constructor(gl, type, typedData, accessType = gl.STATIC_DRAW) {
        this.gl = gl;

        this.type = type;
        this.length = typedData.length;
        this.id = gl.createBuffer();
        gl.bindBuffer(type, this.id);
        gl.bufferData(type, typedData, accessType);
    }

    setData(typedData) {
        if (typedData.length !== this.length)
            throw new Error("Data length does not match buffer length.");

        this.gl.bindBuffer(this.type, this.id);
        this.gl.bufferData(this.type, typedData, this.gl.STATIC_DRAW);
        return this;
    }

    bind() {
        this.gl.bindBuffer(this.type, this.id);
    }
}

export class VertexBuffer extends Buffer {
    constructor(gl, vertexData) {
        super(gl, gl.ARRAY_BUFFER, new Float32Array(vertexData));
    }
}

export class IndexBuffer extends Buffer {
    constructor(gl, indexData) {
        super(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData));
    }
}

export class VertexBufferLayout {
    constructor(gl) {
        this.gl = gl;
        this.attributes = [];
        this.stride = 0;
    }

    addAttribute(location, count, type = this.gl.FLOAT, normalise = false, offset = 0) {
        if (location === -1) throw new Error(`Unknown attribute location (layout element ${this.attributes.length}).`);
        const size = this.getSizeOfType(type);
        this.attributes.push({location, count, type, normalise, size, offset});
        this.stride += offset + (count * size);
        return this;
    }

    getSizeOfType(type) {
        switch (type) {
            case this.gl.UNSIGNED_BYTE:
            case this.gl.BYTE:
                return 1;
            case this.gl.SHORT:
            case this.gl.UNSIGNED_SHORT:
                return 2;
            case this.gl.FLOAT:
            case this.gl.INT:
            case this.gl.UNSIGNED_INT:
                return 4;
            default:
                throw Error(`Unsupported type: ${type}`);
        }
    }
}

export class VertexArray {
    constructor(gl) {
        this.gl = gl;
        this.id = gl.createVertexArray();
        this.buffers = {};
    }

    setBuffer(buffer, shaderName, layoutName = "default") {
        const layout = this.gl["shaders"][shaderName].getLayout(layoutName);

        this.bind();
        buffer.bind();
        let offset = 0;
        for (let i = 0; i < layout.attributes.length; i++) {
            const attribute = layout.attributes[i];
            this.gl.vertexAttribPointer(attribute.location,
                attribute.count, attribute.type, attribute.normalise, layout.stride, attribute.offset + offset);
            this.gl.enableVertexAttribArray(attribute.location);
            offset += attribute.offset + (attribute.count * attribute.size);
        }

        this.buffers[`${shaderName}-${layoutName}`] = buffer;
        return this;
    }

    getBuffer(shaderName, layoutName = "default") {
        return this.buffers[`${shaderName}-${layoutName}`];
    }

    bind() {
        this.gl.bindVertexArray(this.id);
    }
}