#!/usr/bin/env node

import palettes from "nice-color-palettes";
import chalk from "chalk";
import { noise3D, pickRandom, shuffle, mapRange } from "./utils";

const clearScrollback = (): boolean =>
    process.stdout.write("\u001b[H\u001b[2J\u001b[3J");

const createGrid = (): [number, number][] => {
    const pointPositions: [number, number][] = [];
    const columns = process.stdout.columns;
    const rows = process.stdout.rows;

    for (let x = 0; x < rows; x++) {
        for (let y = 0; y < columns; y++) {
            pointPositions.push([x, y]);
        }
    }

    return pointPositions;
};

let drawGridTimeout: NodeJS.Timeout;
const startDrawLoop = (pointPositions: [number, number][]): void => {
    const nColours = 5;
    const randomPalette = shuffle(pickRandom(palettes).slice(0, nColours));

    let noiseZ = 0;
    const noiseZVel = 0.0000022;

    drawGridTimeout = setInterval(() => {
        clearScrollback();

        pointPositions.forEach(position => {
            const [y, x] = position;
            const z = noise3D(x, y, noiseZ);

            const nChars = 9;
            const zMult = Math.abs(Math.floor(z * nChars));
            const colourMap = Math.floor(
                mapRange(zMult, 4, nChars - 1, 0, nColours - 1)
            );

            let char = " ";
            if ([0, 1, 2, 3].includes(zMult)) char = " ";
            if (zMult === 4) char = ".";
            if (zMult === 5) char = "-";
            if (zMult === 6) char = "o";
            if (zMult === 7) char = "+";
            if (zMult === 8) char = "x";
            if (zMult === 9) char = "X";

            const color = randomPalette[colourMap];

            process.stdout.write(chalk.hex(color)(char));

            noiseZ += noiseZVel;
        });
    }, 60);
};

const init = (): void => {
    const grid = createGrid();
    startDrawLoop(grid);
};

init();

let initTimeout: NodeJS.Timeout;
process.stdout.on("resize", () => {
    clearScrollback();
    clearInterval(drawGridTimeout);
    clearTimeout(initTimeout);

    initTimeout = setTimeout(() => init(), 200);
});
