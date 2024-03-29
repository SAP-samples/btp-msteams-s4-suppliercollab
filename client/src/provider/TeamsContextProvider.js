import React, { Component } from 'react';
import TeamsContext from '../context/TeamsContext';

import * as microsoftTeams from "@microsoft/teams-js";
import {clientContext} from '../service/TeamsClientService';

export default class TeamsContextProvider extends Component {
    constructor(props) {
        super(props);
        this.getContext = clientContext(microsoftTeams);
        this.state = {
            teamsClient: microsoftTeams,
            teamsContext: '',
            authCode: '',
            
        };
    }

    componentDidMount(){
        microsoftTeams.getContext((context, error) => {
            this.setState({
                teamsContext: context
            });
        });
        microsoftTeams.authentication.getAuthToken({
            successCallback: (authCode) => {
                this.setState({
                    authCode: authCode
                });
            },
            failureCallback: (error) => {
                console.error("Failed to get auth: ", error)
                console.log(error);
            },
        })
    }

    render() {
        return (
            <TeamsContext.Provider
                value={this.state}
            >
                {this.props.children}
            </TeamsContext.Provider>
        );
    }
}