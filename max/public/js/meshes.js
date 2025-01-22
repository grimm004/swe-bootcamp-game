function parseObj(gl, obj, texture, colour = Colour.white, shader = "") {
    const objParts = obj.split("\n");

    if (shader === "")
        shader = texture ? "texLit" : "colLit";

    const usesTexture = shader === "tex" || shader === "texLit";
    const usesNormals = shader === "colLit" || shader === "texLit";

    const positions = [];
    const textureCoords = [];
    const normals = [];
    const faces = [];

    for (const objPart of objParts) {
        const [type, ...parameters] = objPart.trim().split(" ");
        if (type === "v") positions.push(new Vector3(parameters.map(xStr => Number(xStr))));
        else if (type === "vt" && usesTexture) textureCoords.push(new Vector2(parameters.map(xStr => Number(xStr))));
        else if (type === "vn" && usesNormals) normals.push(new Vector3(parameters.map(xStr => Number(xStr))));
        else if (type === "f") {
            if (parameters.length !== 3)
                throw Error("Wavefront .obj needs to be triangulated.");
            const vertices = [];
            for (const parameter of parameters) {
                const paramParts = parameter.split("/");
                let posIndex = null, texIndex = null, normIndex = null;
                if (paramParts.length > 0)
                    posIndex = Number(paramParts[0]) - 1;
                if (paramParts.length > 1 && paramParts[1] !== "" && usesTexture)
                    texIndex = Number(paramParts[1]) - 1;
                if (paramParts.length > 2 && usesNormals)
                    normIndex = Number(paramParts[2]) - 1;
                vertices.push([posIndex, texIndex, normIndex]);

                // if (posIndex === null || texIndex === null || normIndex === null)
                //     console.log(`Null attribute: ${parameter}: ${posIndex}, ${texIndex}, ${normIndex}`);
            }

            faces.push(vertices);
        }
    }

    const positionMap = new Map();
    const vertexBufferData = [];
    const indexBufferData = [];
    let index = 0;
    for (const face of faces)
        for (const vertex of face) {
            const [posIndex, texIndex, normIndex] = vertex;

            let texMap = positionMap.get(posIndex);

            if (texMap === undefined) {
                texMap = new Map();
                positionMap.set(posIndex, texMap);
            }

            let normMap = texMap.get(texIndex);

            if (normMap === undefined) {
                normMap = new Map();
                texMap.set(texIndex, normMap);
            }

            let cachedIndex = normMap.get(normIndex);
            if (cachedIndex === undefined) {
                cachedIndex = index++;
                normMap.set(normIndex, cachedIndex);

                vertexBufferData.push(...[
                    ...positions[posIndex],
                    ...usesNormals ? normals[normIndex] : [],
                    ...usesTexture ? textureCoords[texIndex] : colour.rgb
                ]);
            }

            indexBufferData.push(cachedIndex);
        }

    const vertexBuffer = new VertexBuffer(gl, vertexBufferData);
    const va = new VertexArray(gl).addBuffer(vertexBuffer, shader);
    const indexBuffer = new IndexBuffer(gl, indexBufferData);
    return new Mesh(gl, va, indexBuffer, shader, texture);
}

class CubeMesh extends Mesh {
    constructor(gl, vertexArray, shaderName, texture) {
        const indexBuffer = new IndexBuffer(gl, [
            0, 1, 2, 0, 2, 3,    // front
            4, 5, 6, 4, 6, 7,    // back
            8, 9, 10, 8, 10, 11,   // top
            12, 13, 14, 12, 14, 15,   // bottom
            16, 17, 18, 16, 18, 19,   // right
            20, 21, 22, 20, 22, 23,   // left
        ]);

        super(gl, vertexArray, indexBuffer, shaderName, texture);
    }
}


class TexCubeMesh extends CubeMesh {
    constructor(gl, texture, size = Vector3.ones, textureSize = Vector2.ones) {
        size.div(2);
        const vertexBuffer = new VertexBuffer(gl, [
            // Front face
            -size.x, -size.y,  size.z,   0.0,  0.0,  1.0,  0.0,           0.0,
             size.x, -size.y,  size.z,   0.0,  0.0,  1.0,  textureSize.x, 0.0,
             size.x,  size.y,  size.z,   0.0,  0.0,  1.0,  textureSize.x, textureSize.y,
            -size.x,  size.y,  size.z,   0.0,  0.0,  1.0,  0.0,           textureSize.y,

            // Back face
            -size.x, -size.y, -size.z,   0.0,  0.0, -1.0,  0.0,           0.0,
            -size.x,  size.y, -size.z,   0.0,  0.0, -1.0,  textureSize.x, 0.0,
             size.x,  size.y, -size.z,   0.0,  0.0, -1.0,  textureSize.x, textureSize.y,
             size.x, -size.y, -size.z,   0.0,  0.0, -1.0,  0.0,           textureSize.y,

            // Top face
            -size.x,  size.y, -size.z,   0.0,  1.0,  0.0,  0.0,           0.0,
            -size.x,  size.y,  size.z,   0.0,  1.0,  0.0,  textureSize.x, 0.0,
             size.x,  size.y,  size.z,   0.0,  1.0,  0.0,  textureSize.x, textureSize.y,
             size.x,  size.y, -size.z,   0.0,  1.0,  0.0,  0.0,           textureSize.y,

            // Bottom face
            -size.x, -size.y, -size.z,   0.0, -1.0,  0.0,  0.0,           0.0,
             size.x, -size.y, -size.z,   0.0, -1.0,  0.0,  textureSize.x, 0.0,
             size.x, -size.y,  size.z,   0.0, -1.0,  0.0,  textureSize.x, textureSize.y,
            -size.x, -size.y,  size.z,   0.0, -1.0,  0.0,  0.0,           textureSize.y,

            // Right face
             size.x, -size.y, -size.z,   1.0,  0.0,  0.0,  0.0,           0.0,
             size.x,  size.y, -size.z,   1.0,  0.0,  0.0,  textureSize.x, 0.0,
             size.x,  size.y,  size.z,   1.0,  0.0,  0.0,  textureSize.x, textureSize.y,
             size.x, -size.y,  size.z,   1.0,  0.0,  0.0,  0.0,           textureSize.y,

            // Left face
            -size.x, -size.y, -size.z,   1.0,  0.0,  0.0,  0.0,           0.0,
            -size.x, -size.y,  size.z,   1.0,  0.0,  0.0,  textureSize.x, 0.0,
            -size.x,  size.y,  size.z,   1.0,  0.0,  0.0,  textureSize.x, textureSize.y,
            -size.x,  size.y, -size.z,   1.0,  0.0,  0.0,  0.0,           textureSize.y,
        ]);

        const vertexArray = new VertexArray(gl).addBuffer(vertexBuffer, "texLit");
        super(gl, vertexArray, "texLit", texture);
    }
}


class ColCubeMesh extends CubeMesh {
    constructor(gl, faceColourData) {
        const vertexPositions = [
            // Front face
            [-1.0, -1.0,  1.0],
            [ 1.0, -1.0,  1.0],
            [ 1.0,  1.0,  1.0],
            [-1.0,  1.0,  1.0],

            // Back face
            [-1.0, -1.0, -1.0],
            [-1.0,  1.0, -1.0],
            [ 1.0,  1.0, -1.0],
            [ 1.0, -1.0, -1.0],

            // Top face
            [-1.0,  1.0, -1.0],
            [-1.0,  1.0,  1.0],
            [ 1.0,  1.0,  1.0],
            [ 1.0,  1.0, -1.0],

            // Bottom face
            [-1.0, -1.0, -1.0],
            [ 1.0, -1.0, -1.0],
            [ 1.0, -1.0,  1.0],
            [-1.0, -1.0,  1.0],

            // Right face
            [ 1.0, -1.0, -1.0],
            [ 1.0,  1.0, -1.0],
            [ 1.0,  1.0,  1.0],
            [ 1.0, -1.0,  1.0],

            // Left face
            [-1.0, -1.0, -1.0],
            [-1.0, -1.0,  1.0],
            [-1.0,  1.0,  1.0],
            [-1.0,  1.0, -1.0],
        ];

        const vertexData = [];
        for (let i = 0; i < vertexPositions.length; i++) {
            vertexData.push(...vertexPositions[i]);
            vertexData.push(
                ...(faceColourData === undefined ? Colour.white.rgb :
                    (faceColourData instanceof Colour ? faceColourData.rgb :
                        faceColourData[Math.floor(i / 6)].rgb))
            );
        }

        const vertexBuffer = new VertexBuffer(gl, vertexData);
        const vertexArray = new VertexArray(gl).addBuffer(vertexBuffer, "col");

        super(gl, vertexArray, "col");
    }
}


class TexPlaneMesh extends Mesh {
    constructor(gl, texture, size = Vector2.ones, normalVector = new Vector3(0.0, 1.0, 0.0)) {
        const vertexBuffer = new VertexBuffer(gl, [
            -size.x,  0.0, -size.y,   normalVector.x, normalVector.y, normalVector.z,  0.0,    0.0,
             size.x,  0.0, -size.y,   normalVector.x, normalVector.y, normalVector.z,  size.x, 0.0,
             size.x,  0.0,  size.y,   normalVector.x, normalVector.y, normalVector.z,  size.x, size.y,
            -size.x,  0.0,  size.y,   normalVector.x, normalVector.y, normalVector.z,  0.0,    size.y,
        ]);

        const vertexArray = new VertexArray(gl).addBuffer(vertexBuffer,  "texLit");

        const indexBuffer = new IndexBuffer(gl, [
            0, 1, 2, 0, 2, 3
        ]);
        super(gl, vertexArray, indexBuffer, "texLit", texture);
    }
}