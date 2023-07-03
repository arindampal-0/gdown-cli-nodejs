import chalk from "chalk";

export default {
    heading: function (msg: string) {
        console.log(chalk.bgWhiteBright.bold(msg));
    },
    print: function (...objects: unknown[]) {
        console.log("🔵", ...objects);
    },
    error: function (msg: string) {
        console.log("🔴", chalk.bgRed(msg));
    },
    success: function (msg: string) {
        console.log("🟢", chalk.bgGreen(msg));
    },
};
