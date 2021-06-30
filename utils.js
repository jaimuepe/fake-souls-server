'use strict';

function is_blank(str) {
    return (!str || /^\s*$/.test(str));
}

export { is_blank };