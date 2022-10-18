import moment from "moment";
const welcomeCard = function () {
  return {
    type: "AdaptiveCard",
    body: [
      {
        type: "TextBlock",
        size: "large",
        weight: "bolder",
        text: "Hi there, I'm the supplier Procurement Bot ",
      },
      {
        type: "TextBlock",
        text: "Here are some of the things you can do:",
        weight: "bolder",
        wrap: true,
      },
      {
        type: "TextBlock",
        text: "- Help you with PO details\n - Provide you the confirmation Detail Summary\n - Help you the schedule call with Supplier",
        wrap: true,
      },

      {
        type: "TextBlock",
        weight: "bolder",
        text: "Ready to get started",
        wrap: true,
      },
      {
        type: "TextBlock",
        text: "To check your order details. Enter the Purchase Order number",
        wrap: true,
        weight: "Default",
        maxLines: 3,
      },
    ],
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.3",
  };
};

const eventPOCard = function (data) {
  console.log(data);

  const columns = data.map((element) => {
    return  {
      type: "ColumnSet",
      columns: [
        {
          type: "Column",
          items: [
            {
              type: "TextBlock",
              text: element.poid
            }
          ],
          verticalContentAlignment: "Center",
          width: 3
        },
        {
          type: "Column",
          items: [
            {
              type: "TextBlock",
              text: element.supplierName,
              wrap: true
            }
          ],
          verticalContentAlignment: "Center",
          width: 4,
          spacing: "None"
        },
        {
          type: "Column",
          items: [
            {
              type: "ActionSet",
              actions: [
                {
                  type: "Action.Submit",
                  title: "Select",
                  data: {
                    dataStore: element,
                    origin: "eventPOCard",
                    action: "submit",
                  },
                }
              ]
            }
          ],
          verticalContentAlignment: "Center",
          spacing: "None",
          width: 2
        }
      ],
      spacing: "Small"
    };
  });

  return {
    type: "AdaptiveCard",
    body: [
      {
        type: "TextBlock",
        text: "Purchase Orders with pending Supplier Confirmations.",
        weight: "Bolder",
        wrap: true
      },
      {
        type: "TextBlock",
        text: "Select the Purchase Order to view the details and schedule a call with the Supplier.",
        wrap: true
      },
      {
        type: "ColumnSet",
        columns: [
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",
                text: "Purchase Order",
                weight: "Bolder"
              }
            ],
            width: 3
          },
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",
                text: "Supplier",
                weight: "Bolder"
              }
            ],
            width: 4,
            verticalContentAlignment: "Center",
            spacing: "None"
          },
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",
                text: "Action",
                weight: "Bolder"
              }
            ],
            verticalContentAlignment: "Center",
            width: 2,
            spacing: "None"
          }
        ],
        horizontalAlignment: "Left"
      },
      ...columns
    ],
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.3"
  }
};

const poItemsDetailCard = function (cardData, graphData,scheduleCallStatus) {

  console.log("Adaptive Card : scheduleCallStatus :" +scheduleCallStatus);
  
  const columns = [];
  //add columns
  for (const poItem of cardData.pendconfitems) {
    columns.push(
      {
        type: "ColumnSet",
        columns: [
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",text: `Item Id : ${poItem.purchasingdocumentitem}`,weight: "Bolder",wrap: true,
              },
            ],
            width: "auto",
          },
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",text: `Material : ${poItem.material}`,weight: "Bolder",wrap: true,
              },
            ],
            width: "auto",
          }
        ],
        separator: true,
      }
    );
    columns.push(
      {
        type: "ColumnSet",
        columns: [
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",text: "Order Quantity",weight: "Bolder",wrap: true,
              },
              {
                type: "TextBlock",text: poItem.orderquantity,wrap: true,
              },
            ],
            width: "auto",
          },
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",text: "Confirmed Quantity",weight: "Bolder",wrap: true,
              },
              {
                type: "TextBlock",text: poItem.committedquantity,wrap: true,
              },
            ],
            width: "auto",
          },
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",text: "Key Date",weight: "Bolder",wrap: true,
              },
              {
                type: "TextBlock",text: poItem.keydate,wrap: true,
              },
            ],
            width: "auto",
          },
        ],
        separator: true,
      }
    );
    columns.push(
      {
        type: "ColumnSet",
        columns: [
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",text: "  ",wrap: true,
              }
            ],
            width: "auto",
          },
        ],
      })
  };
    const actions =
    [
      {
        type: "Action.Submit",
        title: "Yes",
        data: {
          msteams: {
            type: "task/fetch",
            text: "User just clicked the MessageBack button"
          },
          dataStore: cardData,
          graphStore: graphData,
          origin: "poItemsDetailCard",
          action: "Yes",
        },
      },
      {
        type: "Action.Submit",
        title: "No",
        data:{
          origin: "poItemsDetailCard",
          action: "No",
          dataStore: cardData,
          graphStore: graphData,
        }
      },
    ]

  return {
    type: "AdaptiveCard",
    body: [
      {
        type: "TextBlock",
        text: "Purchase Order Line Item and Supplier Confirmation Details for PO Number "+cardData.poid,
        weight: "Bolder",
        wrap: true,
      },
      ...columns,
      {
        type: "TextBlock",
        text: "For further information, would you like to schedule a call with the supplier?",
        weight: "Bolder",
        wrap: true,
      },
      {
        type: 'TextBlock',
        text: 'Call Not Scheduled',
        wrap: true,
        weight: 'Bolder',
        size: 'Medium',
        color: 'Attention',
        isVisible : scheduleCallStatus === 'No' || scheduleCallStatus === 'Close' ? true : false 
      },
      {
        type: 'TextBlock',
        text: 'Call Scheduling',
        wrap: true,
        weight: 'Bolder',
        size: 'Medium',
        color: 'Accent',
        isVisible : scheduleCallStatus === 'Yes' ? true : false 
      },
      {
        type: 'TextBlock',
        text: 'Call Scheduled',
        wrap: true,
        weight: 'Bolder',
        size: 'Medium',
        color: 'Good',
        isVisible : scheduleCallStatus === 'Schedule' ? true : false 
      }
    ],
    actions: scheduleCallStatus ? []:actions ,
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.3",
  };
};

const searchPOCard = function (data) {
  console.log(data);

  const columns = data.to_PurchaseOrderItemTP.results.map((element) => {
    return  {
      type: "ColumnSet",
      columns: [
        {
          type: "Column",
          items: [
            {
              type: "TextBlock",
              text: data.PurchaseOrder
            }
          ],
          verticalContentAlignment: "Center",
          width: 3
        },
        {
          type: "Column",
          items: [
            {
              type: "TextBlock",
              text: element.PurchaseOrderItem+" - "+element.Material+" - "+element.Plant,
              wrap: true
            }
          ],
          verticalContentAlignment: "Center",
          width: 4,
          spacing: "None"
        },
        {
          type: "Column",
          items: [
            {
              type: "ActionSet",
              actions: [
                {
                  type: "Action.Submit",
                  title: "Select",
                  data: {
                    msteams: {
                      type: "messageBack",
                      displayText: `Get Line Item Details for ${data.PurchaseOrder}  with ${element.PurchaseOrderItem} item `,
                      text: `Get Line Item Details for ${data.PurchaseOrder}  with ${element.PurchaseOrderItem} item`,
                      value: {
                        purchaseOrder:data.PurchaseOrder,
                        selectedPurchaseOrderItem: element.PurchaseOrderItem
                      },
                    },
                    origin: "searchPOCard",
                    action: "submit",
                  },
                }
              ]
            }
          ],
          verticalContentAlignment: "Center",
          spacing: "None",
          width: 2
        }
      ],
      spacing: "Small"
    };
  });

  return {
    type: "AdaptiveCard",
    body: [
      {
        type: "TextBlock",
        text: "I've noted your response. please select the appropriate line item.",
        wrap: true
      },
      {
        type: "ColumnSet",
        columns: [
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",
                text: "Purchase Order",
                weight: "Bolder"
              }
            ],
            width: 3
          },
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",
                text: "Item",
                weight: "Bolder"
              }
            ],
            width: 4,
            verticalContentAlignment: "Center",
            spacing: "None"
          },
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",
                text: "Action",
                weight: "Bolder"
              }
            ],
            verticalContentAlignment: "Center",
            width: 2,
            spacing: "None"
          }
        ],
        horizontalAlignment: "Left"
      },
      ...columns
    ],
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.3"
  }
};



const lineItemDetailsCard = function (cardData, graphData,scheduleCallStatus) {

  console.log("Adaptive Card : scheduleCallStatus :" +scheduleCallStatus);

  const selectedItem = cardData.to_PurchaseOrderItemTP.results.find(
    element => element.PurchaseOrderItem === cardData.selectedPurchaseOrderItem )

    console.log(selectedItem)
  
  const columns =
    selectedItem.to_PurOrdSupplierConfirmation.results.map(
      (element, index) => {
        return {
          type: "ColumnSet",
          columns: [
            {
              type: "Column",
              items: [
                {
                  type: "TextBlock",
                  text: `000${index + 1}`,
                },
              ],
              width: 1,
            },
            {
              type: "Column",
              items: [
                {
                  type: "TextBlock",
                  text: element.ConfirmedQuantity,
                },
              ],
              width: 2,
            },
            {
              type: "Column",
              items: [
                {
                  type: "TextBlock",
                  text: moment.utc(element.DeliveryDate).format("DD-MM-YYYY"),
                },
              ],
              width: 2,
            },
          ],
          separator: true,
        };
      }
    );

    const actions =
    [
      {
        type: "Action.Submit",
        title: "Yes",
        data: {
          msteams: {
            type: "task/fetch",
            text: "User just clicked the MessageBack button"
          },
          dataStore: cardData,
          graphStore: graphData,
          origin: "lineItemDetailsCard",
          action: "Yes",
        },
      },
      {
        type: "Action.Submit",
        title: "No",
        data:{
          origin: "lineItemDetailsCard",
          action: "No",
          dataStore: cardData,
          graphStore: graphData,
        }
      },
    ]

  return {
    type: "AdaptiveCard",
    body: [
      {
        type: "TextBlock",
        text: "Based on your response. Here are your order details",
        wrap: true,
      },
      {
        type: "TextBlock",
        text: "ORDER SUMMARY",
        wrap: true,
        weight: "Bolder",
      },
      {
        type: "ColumnSet",
        columns: [
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",
                text: selectedItem.Material,
                weight: "Bolder",
                wrap: true,
              },
              {
                type: "TextBlock",
                text: "Material",
                spacing: "None",
                wrap: true,
              },
            ],
            width: "auto",
          },
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",
                text: selectedItem.OrderQuantity,
                weight: "Bolder",
                wrap: true,
              },
              {
                type: "TextBlock",
                text: "PO Quantity",
                spacing: "None",
                wrap: true,
              },
            ],
            width: "auto",
          },
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",
                text: selectedItem.OrderPriceUnit,
                weight: "Bolder",
                wrap: true,
              },
              {
                type: "TextBlock",
                text: "Order Unit",
                spacing: "None",
                wrap: true,
              },
            ],
            width: "auto",
          },
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",
                text: moment
                  .utc(cardData.PurchaseOrderDate)
                  .format("DD-MM-YYYY"),
                weight: "Bolder",
                wrap: true,
              },
              {
                type: "TextBlock",
                text: "Delivery Date",
                spacing: "None",
                wrap: true,
              },
            ],
            width: "auto",
          },
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",
                text: cardData.Plant,
                weight: "Bolder",
                wrap: true,
              },
              {
                type: "TextBlock",
                text: "Plant",
                spacing: "None",
                wrap: true,
              },
            ],
            width: "auto",
          },
        ],
      },
      {
        type: "TextBlock",
        text: cardData.Supplier_Text,
        wrap: true,
        weight: "Bolder",
        spacing: "Medium",
      },
      {
        type: "TextBlock",
        text: "short text",
        wrap: true,
        spacing: "None",
      },
      {
        type: "TextBlock",
        text: "CONFIRMATION SUMMARY",
        wrap: true,
        weight: "Bolder",
      },
      {
        type: "ColumnSet",
        columns: [
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",
                text: "Confirmation Number",
                weight: "Bolder",
                wrap: true,
              },
            ],
            width: 1,
          },
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",
                text: "Confirmed Quantity",
                weight: "Bolder",
                wrap: true,
              },
            ],
            width: 2,
          },
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",
                text: "Delivery Date",
                weight: "Bolder",
                wrap: true,
              },
            ],
            width: 2,
          },
        ],
      },
      ...columns,
      {
        type: "TextBlock",
        text: "For further information, would you like to schedule a call with the supplier?",
        weight: "Bolder",
        wrap: true,
      },
      {
        type: 'TextBlock',
        text: 'Call Not Scheduled',
        wrap: true,
        weight: 'Bolder',
        size: 'Medium',
        color: 'Attention',
        isVisible : scheduleCallStatus === 'No' || scheduleCallStatus === 'Close' ? true : false 
      },
      {
        type: 'TextBlock',
        text: 'Call Scheduling',
        wrap: true,
        weight: 'Bolder',
        size: 'Medium',
        color: 'Accent',
        isVisible : scheduleCallStatus === 'Yes' ? true : false 
      },
      {
        type: 'TextBlock',
        text: 'Call Scheduled',
        wrap: true,
        weight: 'Bolder',
        size: 'Medium',
        color: 'Good',
        isVisible : scheduleCallStatus === 'Schedule' ? true : false 
      }
    ],
    actions: scheduleCallStatus ? []:actions ,
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.3",
  };
};

const scheduleCallCard = function (cardData,graphData,replyToId) {

  const from = moment(graphData.date).add(1, 'hours').format("HH:mm")
  const to = moment(graphData.date).add(2, 'hours').format("HH:mm")

  return {
    type: "AdaptiveCard",
    body: [
      {
        type: "ColumnSet",
        columns: [
          {
            type: "Column",
            items: [
              {
                type: "Input.Text",
                id: "purchasingDocInputId",
                placeholder: `Purchase Order Summary ${cardData.PurchaseOrder}`,
                label: "Title:",
                value: `Purchase Order Summary ${cardData.PurchaseOrder}`
              }
            ],
            width: 3
          },
          {
            type: "Column",
            items: [
              {
                type: "Input.Text",
                id: "itemsInputId",
                placeholder: "Invite Someone",
                label: "Invite Someone :"
              }
            ],
            width: 2
          },
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",
                isVisible: false,
                text: "Action"
              },
              {
                type: "ActionSet",
                actions: [
                  {
                    type: "Action.Submit",
                    title: "ADD"
                  }
                ],
                spacing: "None"
              }
            ],
            verticalContentAlignment: "Bottom",
            width: 1
          }
        ]
      },
      {
        type: "ColumnSet",
        columns: [
          {
            type: "Column",
            items: [
              {
                type: "Input.Text",
                id: "locationInputId",
                placeholder: "Microsoft Teams meeting",
                label: "Location :",
                value: "Microsoft Teams meeting"
              }
            ],
            width: 3
          },
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",
                text: "Organizer"
              },
              {
                type: "TextBlock",
                text: graphData.profile.displayName,
                spacing: "Small"
              },
              {
                type: "TextBlock",
                text: graphData.profile.mail,
                spacing: "None"
              }
            ],
            width: 3
          }
        ]
      },
      {
        type: "ColumnSet",
        columns: [
          {
            type: "Column",
            items: [
              {
                type: "Input.Date",
                id: "startInputId",
                label: "Start",
                value: moment.utc(new Date()).format("MM/DD/YYYY")
              }
            ],
            width: 3
          },
          {
            type: "Column",
            items: [
              {
                type: "Input.Time",
                id: "fromInputId",
                label: "From",
                value: from
              }
            ],
            width: 3
          },
          {
            type: "Column",
            items: [
              {
                type: "Input.Time",
                id: "toInputId",
                label: "To",
                value: to
              }
            ],
            width: 3
          },
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",
                text: "Supplier"
              },
              {
                type: "TextBlock",
                text: "Nestor Wilke",
                spacing: "Small"
              },
              {
                type: "TextBlock",
                text: "supplier",
                spacing: "None"
              }
            ],
            width: 3
          }
        ]
      },
      {
        type: "ColumnSet",
        columns: [
          {
            type: "Column",
            items: [
              {
                type: "Input.Text",
                id: "detailsInputId",
                placeholder: `Query regarding the Purchase Doc *${cardData.PurchaseOrder}, Items-${cardData.to_PurchaseOrderItemTP.results[0].OrderQuantity}. Test Matieral & vender confirmation`,
                isMultiline: true,
                label: "Details",
                value: `Query regarding the Purchase Doc *${cardData.PurchaseOrder}, Item-${cardData.to_PurchaseOrderItemTP.results[0].OrderQuantity}. Test Matieral & vender confirmation`
              }
            ],
            width: "stretch"
          }
        ]
      }
    ],
    actions: [
      {
        type: "Action.Submit",
        title: "Close",
        data: {
          origin: "scheduleCallCard",
          action: "Close",
          dataStore: cardData,
          graphStore: graphData,
          replyToId:replyToId
        }
      },
      {
        type: "Action.Submit",
        title: "Schedule",
        data: {
          origin: "scheduleCallCard",
          action: "Schedule",
          text: "Schedule a call",
          dataStore: cardData,
          graphStore: graphData,
          replyToId:replyToId
        }
      }
    ],
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.3"
  };
};

const scheduleCallPOEventCard = function (cardData,graphData,replyToId) {

  const from = moment(graphData.date).add(1, 'hours').format("HH:mm")
  const to = moment(graphData.date).add(2, 'hours').format("HH:mm")

  return {
    type: "AdaptiveCard",
    body: [
      {
        type: "ColumnSet",
        columns: [
          {
            type: "Column",
            items: [
              {
                type: "Input.Text",
                id: "purchasingDocInputId",
                placeholder: `Purchase Order Summary ${cardData.poid}`,
                label: "Title:",
                value: `Purchase Order Summary ${cardData.poid}`
              }
            ],
            width: 3
          },
          {
            type: "Column",
            items: [
              {
                type: "Input.Text",
                id: "itemsInputId",
                placeholder: "Invite Someone",
                label: "Invite Someone :"
              }
            ],
            width: 2
          },
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",
                isVisible: false,
                text: "Action"
              },
              {
                type: "ActionSet",
                actions: [
                  {
                    type: "Action.Submit",
                    title: "ADD"
                  }
                ],
                spacing: "None"
              }
            ],
            verticalContentAlignment: "Bottom",
            width: 1
          }
        ]
      },
      {
        type: "ColumnSet",
        columns: [
          {
            type: "Column",
            items: [
              {
                type: "Input.Text",
                id: "locationInputId",
                placeholder: "Microsoft Teams meeting",
                label: "Location :",
                value: "Microsoft Teams meeting"
              }
            ],
            width: 3
          },
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",
                text: "Organizer"
              },
              {
                type: "TextBlock",
                text: graphData.profile.displayName,
                spacing: "Small"
              },
              {
                type: "TextBlock",
                text: graphData.profile.mail,
                spacing: "None"
              }
            ],
            width: 3
          }
        ]
      },
      {
        type: "ColumnSet",
        columns: [
          {
            type: "Column",
            items: [
              {
                type: "Input.Date",
                id: "startInputId",
                label: "Start",
                value: moment.utc(new Date()).format("MM/DD/YYYY")
              }
            ],
            width: 3
          },
          {
            type: "Column",
            items: [
              {
                type: "Input.Time",
                id: "fromInputId",
                label: "From",
                value: from
              }
            ],
            width: 3
          },
          {
            type: "Column",
            items: [
              {
                type: "Input.Time",
                id: "toInputId",
                label: "To",
                value: to
              }
            ],
            width: 3
          },
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",
                text: "Supplier"
              },
              {
                type: "TextBlock",
                text: "Nestor Wilke",
                spacing: "Small"
              },
              {
                type: "TextBlock",
                text: "supplier",
                spacing: "None"
              }
            ],
            width: 3
          }
        ]
      },
      {
        type: "ColumnSet",
        columns: [
          {
            type: "Column",
            items: [
              {
                type: "Input.Text",
                id: "detailsInputId",
                placeholder: `Query regarding the Purchase Doc *${cardData.poid}, Items-${cardData.pendconfitems[0].purchasingdocumentitem}. ${cardData.pendconfitems[0].materialname}`,
                isMultiline: true,
                label: "Details",
                value: `Query regarding the Purchase Doc *${cardData.poid}, Item-${cardData.pendconfitems[0].purchasingdocumentitem}. ${cardData.pendconfitems[0].materialname}`
              }
            ],
            width: "stretch"
          }
        ]
      }
    ],
    actions: [
      {
        type: "Action.Submit",
        title: "Close",
        data: {
          origin: "scheduleCallPOEventCard",
          action: "Close",
          dataStore: cardData,
          graphStore: graphData,
          replyToId:replyToId
        }
      },
      {
        type: "Action.Submit",
        title: "Schedule",
        data: {
          origin: "scheduleCallPOEventCard",
          action: "Schedule",
          text: "Schedule a call",
          dataStore: cardData,
          graphStore: graphData,
          replyToId:replyToId
        }
      }
    ],
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.3"
  };
};

export { welcomeCard, eventPOCard, poItemsDetailCard, searchPOCard, lineItemDetailsCard, scheduleCallCard, scheduleCallPOEventCard };