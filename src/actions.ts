import { Area } from '@workadventure/iframe-api-typings/iframe_api.js';

const tileSize = 32;

enum PositionType {
    LastPositionBreak,
    LastPositionCall,
}

interface Position {
    x: number | undefined;
    y: number | undefined;
}

const positions: Record<PositionType, Position> = {
    [PositionType.LastPositionBreak]: { x: undefined, y: undefined },
    [PositionType.LastPositionCall]: { x: undefined, y: undefined },
};

function clearLastPositions() {
    for (let position of Object.values(positions)) {
        position.x = undefined;
        position.y = undefined;
    }
}

function registerAreaOnLeaveHandler() {
    WA.room.area.onLeave('pauseArea').subscribe(() => {
        clearLastPositions();
    });
    WA.room.area.onLeave('InAMeetingArea').subscribe(() => {
        clearLastPositions();
    });
}

function addTeleportButton(id: string, imageSrc: string, toolTip: string, positionType: PositionType, getArea: () => Promise<Area | undefined>) {
    WA.ui.actionBar.addButton({
        id,
        type: 'action',
        imageSrc,
        toolTip,
        callback: async () => {
            const position = positions[positionType];
            let area;

            if (position.x === undefined || position.y === undefined) {
                area = await getArea();
            }

            teleportPlayerToArea(area, positionType);
        }
    });
}

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


async function teleportPlayerToArea(area: Area | undefined, positionType: PositionType) {
    let x = positions[positionType].x;
    let y = positions[positionType].y;

    if (area !== undefined) {
        const xStart = area.x;
        const xEnd = area.x + area.width - (tileSize / 2);

        const yStart = area.y;
        const yEnd = area.y + area.height - (tileSize / 2);

        x = getRandomInt(xStart, xEnd);
        y = getRandomInt(yStart, yEnd);

        const position = await WA.player.getPosition();
        if (position) {
            Object.assign(positions[positionType], position);
        }
    } else {
        Object.assign(positions[positionType], { x: undefined, y: undefined });
    }

    if (x !== undefined && y !== undefined) {
        WA.player.teleport(x, y);
    }

    removeButtons();
    addActionButtons();
}

function addPauseButton() {
    addTeleportButton('pause-btn',
        'https://github.com/reimerdes/workadventure-ds/blob/master/src/assets/ds/pause.png?raw=true',
        'Zum Pausenbereich teleportieren und zurück',
        PositionType.LastPositionBreak,
        async () => await WA.room.area.get("pauseArea"));
}

function addCustomerCallButton() {
    addTeleportButton('customer-call-btn',
        'https://github.com/reimerdes/workadventure-ds/blob/master/src/assets/ds/call.png?raw=true',
        'Zum \'Im Gespräch\'-Bereich teleportieren und zurück',
        PositionType.LastPositionCall,
        async () => {
            const customerCallArea1 = await WA.room.area.get('InAMeetingArea');

            // Berechne die Mittelpunkte der Areas
        

            // Bestimme die nächstgelegene Area
            return customerCallArea1;
        });
}

function addActionButtons() {
    addPauseButton();
    addCustomerCallButton();
}

function removeButtons() {
    WA.ui.actionBar.removeButton('pause-btn');
    WA.ui.actionBar.removeButton('customer-call-btn');
}

export class Actions {
    static registerActions() {
        addActionButtons();
        registerAreaOnLeaveHandler();
    }
}