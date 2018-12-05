
var vertexShaderText = 
[
'precision mediump float;',
'attribute vec3 position;',
'varying vec3 vColor;',
'',
'uniform mat4 matrix;',
'',
'void main()',
'{',
'	vColor = vec3(position.x, 1, position.y);',
'	gl_PointSize = 1.0;',
'	gl_Position = matrix * vec4(position, 1);',
'}'
].join('\n');

var fragmentShaderText = 
[
'precision mediump float;',
'varying vec3 vColor;',
'',
'void main()',
'{',
'	gl_FragColor = vec4(vColor, 1);',
'}'
].join('\n');

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl');

if(!gl)
{
	throw new Error('WebGL not supported');
}

//Create vertexData
function makeSphere(pointCount)
{
	let points = [];
	for(let i = 0; i < pointCount; i++)
	{
		const r = () => Math.random() - 0.5;
		const inputPoint = [r(), r(), r()];

		const outputPoint = glMatrix.vec3.normalize(glMatrix.vec3.create(), inputPoint);

		points.push(...outputPoint);
	}
	return points;
}

const vertexData = makeSphere(1e3);
//Create Buffer
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
//Load vertexData into buffer
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);


//Create vertex shader
const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertexShaderText);
gl.compileShader(vertexShader);

//Create fragment shader
const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fragmentShaderText);
gl.compileShader(fragmentShader);

//Create program
const program = gl.createProgram();

//Attach shaders to program
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

//Enable vertex attributes
const positionLocation = gl.getAttribLocation(program, 'position');
gl.enableVertexAttribArray(positionLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer); //Buffer was switched when defining color.  Need to rebind the buffer we want to use.
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);


//Draw
gl.useProgram(program);
gl.enable(gl.DEPTH_TEST); // Will render chronologically otherwise

const uniformLocations = {
	matrix: gl.getUniformLocation(program, 'matrix'),
};


const modelMatrix = glMatrix.mat4.create();
const viewMatrix = glMatrix.mat4.create();
const projectionMatrix = glMatrix.mat4.create();
glMatrix.mat4.perspective(projectionMatrix,
	75 * Math.PI/180, // vertical field-of-view (angle, randians)	
	canvas.width/canvas.height, // Aspect Width / Height.  Fixes stretching effect.
	1e-4, // Near cull distance.  If objects get too close, they'll disappear.
	1e4, // Far cull distance.  Objects disappear when they are too far away.  Good for improving performance.
);

const mvMatrix = glMatrix.mat4.create();
const mvpMatrix = glMatrix.mat4.create();

//Be aware that translations can be scaled if done after an object has been scaled.
//Transformations are replayed in the REVERSE ORDER of how they appear in the code!
glMatrix.mat4.translate(modelMatrix, modelMatrix, [0, 0, 0]);
glMatrix.mat4.translate(viewMatrix, viewMatrix, [0, 0.1, 2]);
glMatrix.mat4.invert(viewMatrix, viewMatrix);

function animate()
{
	requestAnimationFrame(animate);
	glMatrix.mat4.rotateY(modelMatrix, modelMatrix, 0.02);

	glMatrix.mat4.multiply(mvMatrix, viewMatrix, modelMatrix);
	glMatrix.mat4.multiply(mvpMatrix, projectionMatrix, mvMatrix); //Transformations will be applied first, then projection will be applied.

	gl.uniformMatrix4fv(uniformLocations.matrix, false, mvpMatrix); //Must apply uniform value whenever we change it.
	gl.drawArrays(gl.LINES, 0, vertexData.length / 3);
}

animate();

