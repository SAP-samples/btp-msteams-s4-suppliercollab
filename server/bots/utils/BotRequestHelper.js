import { CardFactory } from "botbuilder";
import { welcomeCard, searchPOCard, lineItemDetailsCard, scheduleCallCard, 
    eventPOCard, poItemsDetailCard, scheduleCallPOEventCard } from "../../models/adaptiveCards.js";


const getWelcomeCard = async () => {
    return  CardFactory.adaptiveCard(welcomeCard())
}

const getSearchPOCard = async(data) => {
    return CardFactory.adaptiveCard(searchPOCard(data))
}

const getEventPOCard = async(data) => {
    return CardFactory.adaptiveCard(eventPOCard(data))
}

const getPOItemsDetailCard = async(data, graphData,scheduleCallStatus) => {
    return CardFactory.adaptiveCard(poItemsDetailCard(data, graphData,scheduleCallStatus))
}

const getLineItemDetailsCard = async(data, graphData,scheduleCallStatus) => {
    return CardFactory.adaptiveCard(lineItemDetailsCard(data,graphData,scheduleCallStatus))
}

const getScheduleCallCard = async(data,graphData,replyToId) =>{
    return CardFactory.adaptiveCard(scheduleCallCard(data,graphData,replyToId))
}

const getScheduleCallPOEventCard = async(data,graphData,replyToId) =>{
    return CardFactory.adaptiveCard(scheduleCallPOEventCard(data,graphData,replyToId))
}

export { getWelcomeCard, getEventPOCard, getSearchPOCard,getLineItemDetailsCard,getScheduleCallCard, getPOItemsDetailCard, getScheduleCallPOEventCard }