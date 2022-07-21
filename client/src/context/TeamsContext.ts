import React from 'react'
const TeamsContext = React.createContext({
    teamsContext: { meetingId: '', chatId: '', userPrincipalName: '' },
    authCode: '',
})
export default TeamsContext