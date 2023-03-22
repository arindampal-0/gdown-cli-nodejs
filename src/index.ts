async function main() {
    console.log("Hello, World!");
}

if (require.main === module) {
    main().catch((err) => console.error(err));
}
