import axios from 'axios'
import * as microsoftTeams from "@microsoft/teams-js";
const clientContext = async (
    teamsClient: typeof microsoftTeams,
    timeout = 10000
) => {
    return new Promise((resolve, reject) => {
        let shouldReject = true
        teamsClient.getContext((teamsContext: any) => {
            shouldReject = false
            resolve({
                ...teamsContext,
                meetingId: teamsContext.meetingId,
                chatId: teamsContext.chatId,
            })
        })
        setTimeout(() => {
            if (shouldReject) {
                console.error(
                    'Error getting context: Timeout. Make sure you are running the app within teams context and have initialized the sdk'
                )
                reject('Error getting context: Timeout')
            }
        }, timeout)
    })
}

const getPODetailsForChatId = async (
    authCode: string,
    chatId: string
) => {
    const options = {
        headers: {
            Authorization: `Bearer ${authCode}`,
        },
    }
    const url = `/api/getMeetingDataByChatId/${chatId}`;
    return axios.get(url, options);
}

const getPODetails = async (
    authCode: string,
    poId: string
) => {
    const options = {
        headers: {
            Authorization: `Bearer ${authCode}`,
        },
    }
    const url = `/api/s4/fetchpodetails/${poId}`;
    return axios.get(url, options);
}

const getPOItemDetails = async (
    authCode: string,
    poId: string,
    poItemId: string
) => {
    const options = {
        headers: {
            Authorization: `Bearer ${authCode}`,
        },
    }
    const url = `/api/s4/fetchpoitemdetails/${poId}/${poItemId}`;
    return axios.get(url, options);
}

const savePOItemConfirmationDetails = async (
    authCode: string,
    confirmationObj: any
) => {
    const options = {
        headers: {
            Authorization: `Bearer ${authCode}`,
        },
    }
    if(confirmationObj.seqNumber === 0){
        //create case
        const url = `/api/s4/createpoconfirmdetails`;
        return axios.post(url, confirmationObj, options);
    } else {
        //update case
        const url = `/api/s4/updatepoconfirmdetails/${confirmationObj.poId}/${confirmationObj.poItemId}/${confirmationObj.seqNumber}`;
        return axios.put(url, confirmationObj, options);
    }
}

const deletePOItemConfirmationDetails = async (
    authCode: string,
    confirmationObj: any
) => {
    const options = {
        headers: {
            Authorization: `Bearer ${authCode}`,
        },
    }
    const url = `/api/s4/deletepoconfirmdetails/${confirmationObj.poId}/${confirmationObj.poItemId}/${confirmationObj.seqNumber}`;
        return axios.delete(url, options);
}

export {
    clientContext,
    getPODetailsForChatId,
    getPODetails,
    getPOItemDetails,
    savePOItemConfirmationDetails,
    deletePOItemConfirmationDetails
}