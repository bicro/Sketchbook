import { InfoStackMessage } from './InfoStackMessage.js';
import { EntityType } from '../enums/EntityType.js';

export class InfoStack
{
	static updateOrder = 3;
	static entityType = EntityType.System;

	static messages = [];
	static entranceAnimation = 'animate__slideInLeft';
	static exitAnimation = 'animate__backOutDown';

	static messageDuration = 3;

	static addMessage(text)
	{
		let messageElement = document.createElement('div');
		messageElement.classList.add('console-message', 'animate__animated', this.entranceAnimation);
		messageElement.style.setProperty('--animate-duration', '0.3s');
		let textElement = document.createTextNode(text);
		messageElement.appendChild(textElement);
		document.getElementById('console').prepend(messageElement);
		this.messages.push(new InfoStackMessage(this, messageElement));
	}

	static update(timeStep)
	{
		for (const message of this.messages) {
			message.update(timeStep);
		}
	}

	static addToWorld(world)
	{
	}

	static removeFromWorld(world)
	{
	}
}