import { COMMENT_ID_PREFIX, DynamoComment, getDynamoDb, PAGE_ID_PREFIX } from './aws';
import { ItemList, QueryOutput } from 'aws-sdk/clients/dynamodb';
import { DELETED_MESSAGE } from '../config';
import { createHandler, errorResult, successResult } from './common';

import type { GetAllCommentsResponse, Comment } from '../common/types/get-all-comments-response';
import type { QueryInput } from 'aws-sdk/clients/dynamodb';

const DELETED_AUTHOR = 'Anonymous';
const DELETED_AUTHOR_ID = 'ANONYMOUS';

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
                    id: isDeleted ? DELETED_AUTHOR_ID : item.userId.S,
                    name: isDeleted ? DELETED_AUTHOR : item.author.S
                },
                text: isDeleted ? DELETED_MESSAGE : item.commentText.S,
                timestamp: item.timestamp.S,
                isEdited: !isDeleted && !!(item.editedAt?.S),
                replies: children
            });
        }
    });
    return comments;
}

export const handler = createHandler({
    hasJsonBody: false,
    requiresAuth: false,
    handle: event => {
        const url = decodeURIComponent(event.pathParameters.url);
        const params: QueryInput = {
            TableName: process.env.TABLE_NAME,
            KeyConditionExpression: "PK = :u", 
            ExpressionAttributeValues: {
                ':u': { S: PAGE_ID_PREFIX + url }
            }, 
            Select: 'ALL_ATTRIBUTES'
        };

        return new Promise(resolve => {
            dynamo.query(params, (err, data) => {
                if (err) {
                    resolve(errorResult(500, err.message));
                }
                else {
                    resolve(successResult(convertDataToResponse(data)));
                }
            })
        });
    }
});
