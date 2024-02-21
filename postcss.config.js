module.exports = {
    plugins: {
        autoprefixer: {},
        'postcss-preset-env': {},
        'postcss-pxtorem': {
            rootValue: 16,
            propList: ['*'],
            selectorBlackList: ['*-origin'],
        },
    },
};
