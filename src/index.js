import React, { DOM, Component } from 'react';
import * as esprima from 'esprima';

let AUTH_RULES = {};
let COMPONENT_RULES = {};

function getExpressionValue(expression, data) {
    const codes = [];
    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            const value =
                typeof data[key] === 'string' ? `"${data[key]}"` : data[key];
            codes.push(`var ${key} = ${value};`);
        }
    }
    codes.push(`return ${expression};`);
    return new Function(codes.join(''))();
}


function toPromise(obj) {
    if (!obj) {
        return obj;
    }
    if ('boolean' === typeof obj) {
        return new Promise((resolve) => {
            resolve(true);
        });
    }
    if ('function' === typeof obj) {
        return obj();
    }
    return obj;
}

function lexicalAnalyis(expression = '') {
    const token = esprima.tokenize(expression);
    const ret = token.filter((t) => {
        return t.type === 'Identifier';
    }).map((t) => {
        return t.value;
    });
    return ret;
}


function getRuleResult(rules = []) {
    const rulePromises = [];
    rules.forEach((rule) => {
        rulePromises.push(toPromise(AUTH_RULES[rule]));
    });
    return Promise.all(rulePromises);
}

function getDisplayName(WrappedComponent) {
    return WrappedComponent.displayName ||
        WrappedComponent.name ||
        'Component';
}

// 基于组件displayName的静态校验：直接控制是否显示、隐藏
function getComponentRuleValue(displayName = '') {
    if (COMPONENT_RULES.hasOwnProperty(displayName) && !COMPONENT_RULES[displayName]) { // 组件不在名单中时默认展示
        return false;
    }
    return COMPONENT_RULES[displayName] || '';
}

export default (options = {}) => {
    return (WrappedComponent) => {
        class Auth extends Component {

            constructor(props) {
                super(props);
                this.childDisplayName = getDisplayName(WrappedComponent);
                this._getAuthResult(options);
            }

            state = {
                $auth: undefined,
            }

            _getAuthResult(opt = {}) {
                if (opt.rules) {
                    //  基于规则维度
                    const keys = Object.keys(opt.rules) || [];
                    keys.forEach(k => {
                        const expression = opt.rules[k];
                        const rules = lexicalAnalyis(expression);
                        const result = getRuleResult(rules);
                        result.then((values) => {
                            const data = {};
                            rules.forEach((r, i) => {
                                data[r] = values[i];
                            });
                            const ret = getExpressionValue(expression, data);
                            const { $auth = {} } = this.state;
                            this.setState({
                                $auth: Object.assign($auth, { [k]: ret })
                            });
                        });
                    });
                } else {
                    // 基于整个组件维度
                    const expression = getComponentRuleValue(this.childDisplayName);
                    const rules = lexicalAnalyis(expression);
                    const result = getRuleResult(rules);
                    result.then((values) => {
                        const data = {};
                        rules.forEach((r, i) => {
                            data[r] = values[i];
                        });
                        const ret = getExpressionValue(expression, data);
                        this.setState({
                            $auth: {
                                _result: ret,
                            },
                        });
                    });
                }
            }

            render() {
                const { initialHide = true, placeholder, rules } = options;
                const { $auth } = this.state;
                // 1. 规则属性模式
                if (rules) {
                    return <WrappedComponent {...this.props} $auth={this.state.$auth} />;
                }
                // 2. 组件显隐模式
                if ($auth === undefined && initialHide) {
                    // 异步规则 && 初始隐藏
                    return placeholder || DOM.noscript();
                } else if ($auth && $auth._result === false) {
                    // 权限结果为false && 权限结果为false时隐藏
                    return placeholder || DOM.noscript();
                } else {
                    return <WrappedComponent {...this.props} $auth={this.state.$auth} />;
                }
            }
        }

        Auth.displayName = `Auth-${getDisplayName(WrappedComponent)}`;

        return Auth;
    };
};

export function registerAuthRules(rules = {}) {
    const ret = {
        ...AUTH_RULES,
        ...rules,
    };
    AUTH_RULES = ret;
    return ret;
}

export function registerComponentRules(rules = {}) {
    const ret = {
        ...COMPONENT_RULES,
        ...rules,
    };
    COMPONENT_RULES = ret;
    return ret;
}
