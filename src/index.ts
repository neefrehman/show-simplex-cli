#!/usr/bin/env node

import { program } from "commander";
import palettes from "nice-color-palettes";
import chalk, { Chalk } from "chalk";
import { noise3D, pickRandom, shuffle, mapRange } from "./utils";

program
    .version("1.1.0")
    .description("Displays an animated simplex noise field in your terminal")
    .option("-a, --angle", "outputs noise field as angles")
    .option("-b, --block", "outputs noise field as colour blocks")
    .option(
        "-n, --number",
        "shows the numeric value of the noise field at each point"
    )
    .parse(process.argv);

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

    type Color = string;
    type Char = string | number;

    let color: Color;
    let char: Char = " ";

    let noiseZ = 0;
    const noiseZVel = 0.0000022;
    let zMult: number;

    const chalkWrite = (color: string): Chalk =>
        program.block ? chalk.bgHex(color) : chalk.hex(color);

    const drawBlock = (z: number): [Color] => {
        const nChars = 5;
        zMult = Math.abs(Math.floor(z * nChars));
        const colourMap = Math.floor(
            mapRange(zMult, 0, nChars - 1, 0, nColours - 1)
        );
        color = randomPalette[colourMap];

        return [color];
    };

    const drawAngle = (z: number): [Color, Char] => {
        const nChars = 4;
        zMult = Math.abs(Math.floor(z * nChars));
        const colourMap = Math.floor(
            mapRange(zMult, 0, nChars - 1, 0, nColours - 1)
        );
        color = randomPalette[colourMap];

        if (zMult === 0) char = "|";
        if (zMult === 1) char = "/";
        if (zMult === 2) char = "—";
        if (zMult === 3) char = "\\";

        return [color, char];
    };

    const drawAscii = (z: number): [Color, Char] => {
        const nChars = 9;
        zMult = Math.abs(Math.floor(z * nChars));
        const colourMap = Math.floor(
            mapRange(zMult, 4, nChars - 1, 0, nColours - 1)
        );
        color = randomPalette[colourMap];

        if ([0, 1, 2, 3].includes(zMult)) char = " ";
        if (zMult === 4) char = ".";
        if (zMult === 5) char = "-";
        if (zMult === 6) char = "o";
        if (zMult === 7) char = "+";
        if (zMult === 8) char = "x";
        if (zMult === 9) char = "X";

        return [color, char];
    };

    drawGridTimeout = setInterval(() => {
        clearScrollback();
        pointPositions.forEach(position => {
            const [y, x] = position;
            const z = noise3D(x, y, noiseZ);

            if (program.block) {
                [color] = drawBlock(z);
            } else if (program.angle) {
                [color, char] = drawAngle(z);
            } else {
                [color, char] = drawAscii(z);
            }

            if (program.number) char = zMult;
            process.stdout.write(chalkWrite(color)(char));

            noiseZ += noiseZVel;
        });
    }, 80);
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
