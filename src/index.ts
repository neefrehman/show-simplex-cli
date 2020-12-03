#!/usr/bin/env node

import { program } from "commander";
import palettes from "nice-color-palettes";
import chalk, { Chalk } from "chalk";
import makeMatrix from "make-matrix";

import { noise3D, pickRandom, shuffle, mapRange } from "./mathUtils";
import { clearScrollback } from "./cliUtils";

program
    .version("1.1.0")
    .description("Displays an animated simplex noise field in your terminal")
    .option("-a, --angle", "outputs noise field as angles")
    .option("-b, --block", "outputs noise field as colour blocks")
    .option(
        "-n, --number",
        "shows the numeric value of the noise field at each point"
    )
    .option(
        "-t, --timeout <milliseconds>",
        "adds a timeout (in millisecnods) to the noise field generation"
    )
    .parse(process.argv);

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

    let drawGrid: (z: number) => [Color, Char] | [Color];

    if (program.block) {
        drawGrid = drawBlock;
    } else if (program.angle) {
        drawGrid = drawAngle;
    } else {
        drawGrid = drawAscii;
    }

    drawGridTimeout = setInterval(() => {
        clearScrollback();
        pointPositions.forEach(position => {
            const [y, x] = position;
            const z = noise3D(x, y, noiseZ);

            drawGrid(z);

            if (program.number) char = zMult;
            process.stdout.write(chalkWrite(color)(char));

            noiseZ += noiseZVel;
        });
    }, 80);
};

const createGrid = (): [number, number][] => {
    const columns = process.stdout.columns ?? 0;
    const rows = process.stdout.rows ?? 0;
    const pointPositions = makeMatrix([rows, columns], pos => pos).flat(1);

    return pointPositions as [number, number][];
};

const init = (): void => {
    const grid = createGrid();
    startDrawLoop(grid);

    if (program.timeout !== undefined) {
        setTimeout(() => {
            clearInterval(drawGridTimeout);
            clearScrollback();
        }, program.timeout);
    }
};

init();

let initTimeout: NodeJS.Timeout;
process.stdout.on("resize", () => {
    clearScrollback();
    clearInterval(drawGridTimeout);
    clearTimeout(initTimeout);

    initTimeout = setTimeout(() => init(), 200);
});
