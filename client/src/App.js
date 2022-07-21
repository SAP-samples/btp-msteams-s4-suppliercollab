import React, { Suspense, useState } from 'react';
import { BrowserRouter as Router, Route } from "react-router-dom";
import { Provider, themeNames } from "@fluentui/react-teams";
import * as microsoftTeams from "@microsoft/teams-js";

import { PODetails } from './components/podetails/PODetails'
import { Configure } from './components/configure/Configure'

import './App.css';

microsoftTeams.initialize();

function App() {
    const [theme] = useState(themeNames.Dark)

    return (
        <Provider themeName={theme} lang="en-US">
            <Suspense fallback="loading">
                <Router>
                    <Route exact path="/podetails" component={ PODetails } />
                    <Route exact path="/configure" component={ Configure } />
                </Router>
            </Suspense>
        </Provider>
    );
}

export default App;