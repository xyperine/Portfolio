/**
 * Must have exactly the same values and operations as the shader
 * to be able to produce the same outputs.
 */
export class VertexShaderAlgorithmCopy {
	constructor(seed, heightLimit, freq, octaves, lacunarity, persistence) {
		this.seed = seed;
		this.heightLimit = heightLimit;
		this.freq = freq;
		this.octaves = octaves;
		this.lacunarity = lacunarity;
		this.persistence = persistence;
	}

	getHeight(x, z) {
		let h = 0.0;

		let frequency = this.freq;
		let amplitude = this.heightLimit;

		for (let i = 0; i < this.octaves; i++) {
			h += this.#snoise(x * frequency, z * frequency) * amplitude;

			frequency *= this.lacunarity;
			amplitude *= this.persistence;
		}

		return h;
	}

	#snoise(vx, vy) {
		const Cx = 0.211324865405187;
		const Cy = 0.366025403784439;
		const Cz = -0.577350269189626;
		const Cw = 0.024390243902439;

		// First corner
		let ix = Math.floor(vx + (vx + vy) * Cy);
		let iy = Math.floor(vy + (vx + vy) * Cy);

		const t = (ix + iy) * Cx;

		const x0x = vx - ix + t;
		const x0y = vy - iy + t;

		// Other corners
		const i1x = x0x > x0y ? 1 : 0;
		const i1y = x0x > x0y ? 0 : 1;

		const x12x = x0x - i1x + Cx;
		const x12y = x0y - i1y + Cx;
		const x12z = x0x + Cz;
		const x12w = x0y + Cz;

		ix = this.#mod289(ix);
		iy = this.#mod289(iy);

		let p0 = this.#permute(this.#permute(iy + 0.0) + ix + 0.0);
		let p1 = this.#permute(this.#permute(iy + i1y) + ix + i1x);
		let p2 = this.#permute(this.#permute(iy + 1.0) + ix + 1.0);

		const flooredSeed = Math.floor(this.seed * 213898.0);
		p0 = this.#permute(this.#mod289(p0 + flooredSeed));
		p1 = this.#permute(this.#mod289(p1 + flooredSeed));
		p2 = this.#permute(this.#mod289(p2 + flooredSeed));
		//p = permute(mod289(p + vec3(floor(seed * 2138988197.0))));

		let grad = (p, x, y) => {
			const gx = 2.0 * this.#fract(p * Cw) - 1.0;
			const gy = Math.abs(gx) - 0.5;
			const ox = Math.floor(gx + 0.5);
			const ax = gx - ox;

			let m = 0.5 - (x * x + y * y);
			if (m < 0.0) return 0.0;

			m *= m;
			m *= m;
			m *= 1.79284291400159 - 0.85373472095314 * (ax * ax + gy * gy);

			return m * (ax * x + gy * y);
		};

		return (
			130.0 *
			(grad(p0, x0x, x0y) + grad(p1, x12x, x12y) + grad(p2, x12z, x12w))
		);
	}

	#mod289(x) {
		return x - Math.floor(x / 289.0) * 289.0;
	}

	#permute(x) {
		return this.#mod289((x * 34.0 + 10.0) * x);
	}

	#fract(x) {
		return x - Math.floor(x);
	}
}
