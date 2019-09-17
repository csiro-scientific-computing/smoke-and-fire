exports.ubershader = {
    uniforms: {
        map: { type: "t", value: null },
        time: { type: "f", value: 0.0 },
        opacity: { type: "f", value: 1.0 },
        radius: { type: "f", value: 100.0 },
        staticValue: { type: "f", value: 0.0 },
        normalValue: { type: "f", value: 1.0 },
        minValue: { type: "f", value: 0.0 },
        size: { type: "f", value: 1.0 },
        scale: { type: "f", value: 0.0 },
        r: { type: "f", value: 1.0 },
        g: { type: "f", value: 1.0 },
        b: { type: "f", value: 1.0 }
    },
    vertexShader: [
        "uniform float radius, scale, size;",
        "varying vec3 vNormal;",
        "varying vec2 vUv;",
        "varying vec3 vPosition;",

        "void main() {",
        "float longitude = radians(position.x);",
        "float latitude = radians(position.y);",
        "vPosition = position;",
        "vUv = uv;",

        "float r = radius;",
        "vec4 sphericalPosition = vec4( r * cos(latitude) * cos (longitude),",
        "                               r * cos(latitude) * sin (longitude),",
        "                               r * sin(latitude),",
        "                               1.0 );",
        "sphericalPosition.xyz = sphericalPosition.xzy;",
        "sphericalPosition.x *= -1.0;",

        "vNormal = normalize(normalMatrix * sphericalPosition.xyz);",
        "vec4 mvPosition = modelViewMatrix * sphericalPosition;",
        "gl_PointSize = (size + clamp(vPosition.z * scale, 0.0, 5.0)) * (100.0 / length(mvPosition.xyz));",
        "gl_Position = projectionMatrix * mvPosition;",
        "}"
    ].join("\n"),
    fragmentShader: [
        "uniform float r, g, b, opacity;",
        "uniform float normalValue, minValue, staticValue;",
        "varying vec3 vNormal;",
        "varying vec3 vPosition;",

        "void main() {",
        "float view = ( dot( vNormal, vec3( 0.0, 0.0, 1.0 ) ) + 1.0 ) / 2.0;",
        "float value = max(vPosition.z * step(minValue, vPosition.z), staticValue);",
        "float normalisedValue = value / normalValue;",
        "float cappedValue = clamp(normalisedValue, 0.0, 1.0);",
        "gl_FragColor = vec4(vec3(r, g, b) * cappedValue, opacity * cappedValue) * view;",
        "}"
    ].join("\n")
};

exports.pointcloud = {
    fragmentShader: [
        "uniform float r, g, b, opacity, time;",
        "uniform float normalValue, minValue;",
        "varying vec3 vNormal;",
        "varying vec3 vPosition;",

        "void main() {",
        "float view = ( dot( vNormal, vec3( 0.0, 0.0, 1.0 ) ) + 1.0 ) / 2.0;",
        "float value = vPosition.z + minValue;",
        "float normalisedValue = value / normalValue;",
        "float cappedValue = clamp(normalisedValue, 0.0, 1.0);",
        "float radial = smoothstep(0.0, 0.4, 1.0 - length(gl_PointCoord.xy * 2.0 - vec2(1.0)));",
        "gl_FragColor = vec4(vec3(r, g, b) * cappedValue, opacity * radial) * view;",
        "}"
    ].join("\n")
};

exports.image = {
    fragmentShader: [
        "uniform sampler2D map;",
        "uniform float opacity, time;",
        "varying vec3 vPosition;",
        "varying vec3 vNormal;",
        "varying vec2 vUv;",

        "void main() {",
        "float view = ( dot( vNormal, vec3( 0.0, 0.0, 1.0 ) ) + 1.0 ) / 2.0;",
        "vec4 colour = texture2D(map, vUv);",
        "gl_FragColor = colour * view;",
        "}"
    ].join("\n")
};
