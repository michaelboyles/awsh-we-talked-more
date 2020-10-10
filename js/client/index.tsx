import * as React from 'react';
import { useState } from 'react';
import * as ReactDOM from 'react-dom';
import './style.scss';
import { formatPastDate } from './time';

interface Author {
    name: string;
    portraitUrl?: string;
}

interface Comment {
    id: CommentId;
    text: string;
    author: Author;
    timestamp: Date;
    replies: Comment[];
}

type CommentId = string;

function submitComment(event: React.FormEvent<HTMLFormElement>, inReplyTo?: CommentId) {
    if (inReplyTo) {
        alert(`You replied to ${inReplyTo}!`);
    }
    else {
        alert(`You commented on ${window.location}`)
    }
    event.preventDefault();
}

function AddComment(props: { inReplyTo?: CommentId }) {
    return (
        <form onSubmit={e => submitComment(e, props.inReplyTo)}>
            <textarea></textarea>
            <button type="submit">Post</button>
        </form>
    );
}

function ShowComment(comment: Comment) {
    const [isReplyOpen, setReplyOpen] = useState(false);

    return (
        <li className='comment'>
            <img className='portrait' src={comment.author.portraitUrl ? comment.author.portraitUrl : 'https://via.placeholder.com/100x100' } />
            <div className='body'>
                <span className='author-name'>{comment.author.name}</span>
                <span className='timestamp'>{formatPastDate(comment.timestamp)}</span>
                <span className='content'>{comment.text}</span>
                <a onClick={() => setReplyOpen(!isReplyOpen)} className={isReplyOpen ? 'open' : 'closed'}>Reply</a>
                {
                    isReplyOpen ? <AddComment inReplyTo={ comment.id } /> : null
                }
                {
                    comment.replies.length ?
                        <ul>{ comment.replies.map(reply => ShowComment(reply)) }</ul>
                        :
                        null
                }
            </div>
        </li>
    );
}

// Some mock data
const comments: Comment[] = [
    {
        id: '123',
        text: 'This is a comment',
        author: {
            name: 'Cpt Obvious'
        },
        timestamp: new Date(),
        replies: [
            {
                id: '456',
                text: 'I agree with you. That is a comment',
                author: {
                    name: 'Michael'
                },
                timestamp: new Date(),
                replies: []
            }
        ]
    }
]

function Comments() {
    return (
        <>
            <AddComment />
            <ul className='comments'>
                { comments.map(comment => ShowComment(comment)) }
            </ul>
        </>
    );
}

ReactDOM.render(<Comments />, document.getElementById('comments'));
