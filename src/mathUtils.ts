import SimplexNoise from "simplex-noise";

const noiseGenerator = new SimplexNoise();

export const noise3D = (x: number, y: number, z: number): number =>
    noiseGenerator.noise3D(x, y, z);

export const mapRange = (
    value: number,
    inputMin: number,
    inputMax: number,
    outputMin: number,
    outputMax: number
): number => {
    if (Math.abs(inputMin - inputMax) < Number.EPSILON) return outputMin;

    let outVal =
        ((value - inputMin) / (inputMax - inputMin)) * (outputMax - outputMin) +
        outputMin;

    if (outputMax < outputMin) {
        if (outVal < outputMax) {
            outVal = outputMax;
        } else if (outVal > outputMin) {
            outVal = outputMin;
        }
    } else if (outVal > outputMax) {
        outVal = outputMax;
    } else if (outVal < outputMin) {
        outVal = outputMin;
    }

    return outVal;
};

export const shuffle = <T>(array: T[]): T[] => {
    const a = [...array];

    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

export const pickRandom = <T>(array: T[]): T =>
    array[Math.floor(Math.random() * array.length)];
