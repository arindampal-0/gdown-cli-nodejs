async function cli() {
    console.log("Hello, World!");
}

if (require.main === module) {
    cli().catch((err) => console.error(err));
}
