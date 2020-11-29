import { ApiGatewayRequest, ApiGatewayResponse, COMMENT_ID_PREFIX, DynamoComment, getDynamoDb } from './aws';
import type { Handler } from 'aws-lambda'
import type { GetAllCommentsResponse, Comment } from '../common/types/get-all-comments-response'
import { ItemList, QueryOutput } from 'aws-sdk/clients/dynamodb';
import type { QueryInput } from 'aws-sdk/clients/dynamodb';
import { DELETED_MESSAGE } from '../config';
import { CORS_HEADERS } from './common';

const dynamo = getDynamoDb();

function convertDataToResponse(data: QueryOutput) : GetAllCommentsResponse {
    return {
        comments: sortToHeirarchy(data.Items, '')
    };
}

function sortToHeirarchy(items: ItemList, parentId: string) : Comment[] {
    const comments: Comment[] = [];
    items.forEach((item: DynamoComment) => {
        if (item.parent.S === parentId) {
            const isDeleted = !!(item.deletedAt?.S);
            const children = sortToHeirarchy(items, item.SK.S);
            if (isDeleted && !children.length) {
                return;
            }
            comments.push({
                id: item.SK.S.substr(COMMENT_ID_PREFIX.length),
                author: {
                    id: isDeleted ? 'ANONYMOUS' : item.userId.S,
                    name: isDeleted ? 'Anonymous' : item.author.S
                },
                text: isDeleted ? DELETED_MESSAGE : item.commentText.S,
                timestamp: item.timestamp.S,
                isEdited: !!(item.editedAt?.S),
                replies: children
            });
        }
    });
    return comments;
}

export const handler: Handler = function(event: ApiGatewayRequest, _context) {
    const url = decodeURIComponent(event.pathParameters.url);
    const params: QueryInput = {
        TableName: 'FLAMEWARS',
        KeyConditionExpression: "PK = :u", 
        ExpressionAttributeValues: {
            ':u': { S: 'PAGE#' + url }
        }, 
        Select: 'ALL_ATTRIBUTES'
    };

    return new Promise((resolve, reject) => {
        dynamo.query(params, (err, data) => {
            if (err) {
                console.log(err, err.stack);
                const response: ApiGatewayResponse = {
                    statusCode: 500,
                    headers: CORS_HEADERS,
                    body: JSON.stringify(event)
                };
                reject(response);
            }
            else {
                const response: ApiGatewayResponse = {
                    statusCode: 200,
                    headers: CORS_HEADERS,
                    body: JSON.stringify(convertDataToResponse(data))
                };
                resolve(response);
            }
        })
    });
}
