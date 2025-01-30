import pluginVue from 'eslint-plugin-vue';
export default [
    { ignores: ['dist/'] },
    // add more generic rulesets here, such as:
    // js.configs.recommended,
    ...pluginVue.configs['flat/recommended'],
    // ...pluginVue.configs['flat/vue2-recommended'], // Use this if you are using Vue.js 2.x.
    {
        rules: {
            // override/add rules settings here, such as:
            "vue/no-mutating-props": ["error", {
                "shallowOnly": true
            }],
            "vue/require-default-prop": ["off"],
        },
    }
];
