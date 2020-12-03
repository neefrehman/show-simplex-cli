export const clearScrollback = (): boolean =>
    process.stdout.write("\u001b[H\u001b[2J\u001b[3J");
