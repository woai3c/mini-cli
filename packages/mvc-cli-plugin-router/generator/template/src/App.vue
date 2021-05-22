---
extend: 'mvc-cli-service/generator/template/src/App.vue'
replace:
  - !!js/regexp /<template>[^]*?<\/template>/
  - !!js/regexp /\r\n<script>[^]*?<\/script>\r\n/
  - !!js/regexp /    margin-top[^]*?<\/style>/
---

<%# REPLACE %>
<template>
    <div id="app">
        <div id="nav">
            <router-link to="/">Home</router-link> |
            <router-link to="/about">About</router-link>
        </div>
        <router-view/>
    </div>
</template>
<%# END_REPLACE %>

<%# REPLACE %>
<%# END_REPLACE %>

<%# REPLACE %>
}

#nav {
    padding: 30px;
}

#nav a {
    font-weight: bold;
    color: #2c3e50;
}

#nav a.router-link-exact-active {
    color: #42b983;
}
</style>
<%# END_REPLACE %>
