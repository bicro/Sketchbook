const path = require('path');

module.exports = {
    entry: {
        app: './src/ts/sketchbook.ts'
    },
    output: {
        filename: 'sketchbook.min.js',
        path: path.resolve(__dirname, 'build'),
        library: {
            name: 'Sketchbook',
            type: 'umd',
            export: 'default'
        },
        globalObject: 'this',
        clean: true
    },
    resolve: {
        alias: {
          cannon: path.resolve(__dirname, './src/lib/cannon/cannon.js')
        },
        extensions: [ '.tsx', '.ts', '.js' ],
        fallback: {
            "path": false,
            "fs": false
        }
    },
    module: {
        rules: [
        {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
        },
        {
            test: /\.css$/,
            use: [
                { loader: 'style-loader', options: { injectType: 'singletonStyleTag' } },
                { loader: 'css-loader' },
            ]
        }
      ]
    },
    performance: {
        hints: false
    }
};
