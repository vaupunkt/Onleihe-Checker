module.exports = {
    build: {
        overwriteDest: true,
        artifacts: {
            dir: "dist",
            format: "zip",
        },
    },
    lint: {
        enabled: true,
        rules: {
            "manifest": "error",
            "background": "error",
            "content": "error",
            "popup": "error",
        },
    },
    "web-ext": {
        "browser": "firefox",
        "source": "src",
        "manifest": "manifest.json",
    },
};