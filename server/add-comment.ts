import type { AddCommentRequest } from '../common/types/add-comment-request'
import type { AddCommentResponse } from '../common/types/add-comment-response'
import { ApiGatewayRequest, ApiGatewayResponse, COMMENT_ID_PREFIX, DynamoComment, getDynamoDb } from './aws'
import type { Handler } from 'aws-lambda'
import { PutItemInput } from 'aws-sdk/clients/dynamodb'
import { AuthenticationResult, checkAuthentication } from './user-details'
import { AWS_GET_URL, MAX_COMMENT_LENGTH, MAX_FIELD_LENGTH } from '../config'
import { v4 as uuid } from 'uuid';
import { CORS_HEADERS } from './common';
import { normalizeUrl } from '../common/util'

const dynamo = getDynamoDb();

export const handler: Handler = async function(event: ApiGatewayRequest, _context) {
    const request: AddCommentRequest = JSON.parse(event.body);

    if (!isValid(request)) {
        return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({"success": false})
        } as ApiGatewayResponse;
    }

    const authResult: AuthenticationResult = await checkAuthentication(request.authorization);

    const commentId = uuid();
    const timestamp = new Date().toISOString();
    const parent = request.inReplyTo ? (COMMENT_ID_PREFIX + request.inReplyTo) : '';
    const url = normalizeUrl(decodeURIComponent(event.pathParameters.url));

    const dynamoComment: DynamoComment = {
        PK       : { S: 'PAGE#' + url },
        SK       : { S: COMMENT_ID_PREFIX + commentId },
        pageUrl  : { S: url },
        commentText: { S: request.comment },
        parent   : { S: parent },
        timestamp: { S: timestamp },
        author   : { S: authResult.userDetails.name },
        userId   : { S: authResult.userDetails.userId },
        isDeleted: { BOOL: false },
        isEdited:  { BOOL: false }
    };
    const params: PutItemInput = {
        TableName: 'FLAMEWARS',
        Item: dynamoComment
    };

    return dynamo.putItem(params)
        .promise()
        .then(() => {
            const body: AddCommentResponse = {
                success: true,
                comment: {
                    id: commentId,
                    author: {
                        id: authResult.userDetails.userId,
                        name: authResult.userDetails.name
                    },
                    text: request.comment,
                    timestamp: timestamp,
                    isEdited: false,
                    replies: []
                }
            };
            return {
                statusCode: 201,
                headers: {...CORS_HEADERS, location: `${AWS_GET_URL}/${encodeURIComponent(url)}/${commentId}` },
                body: JSON.stringify(body)
            } as ApiGatewayResponse;
        });
}

function isValid(request: AddCommentRequest){
    return request.comment && request.comment.length <= MAX_COMMENT_LENGTH
        && (!request.inReplyTo || request.inReplyTo.length <= MAX_FIELD_LENGTH)
        && request.authorization;
}