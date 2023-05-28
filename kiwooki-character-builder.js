import { CharacterCreator } from './scripts/character-creator.js';

Hooks.on("init", async function () {
    CONFIG.debug.hooks = true;
});

var CHAR_CREATOR = null

Hooks.on("renderCharacterSheetPF2e", (character_sheet, character_html, css_class) => {
    let header = character_html.find(`[class="header-button close"]`)
    const tooltip = game.i18n.localize('CHARACTER-CREATOR.button-title');
    header.before(
        '<button type="button" class="header-button character-creator-button" title="' + tooltip + '"><i class="fas fa-tasks"></i>' + tooltip + '</button>'
    );

    // register an event listener for this button
    character_html.on('click', '.character-creator-button', (event) => {
        // const userId = $(event.currentTarget).parents('[data-user-id]')?.data()?.userId;
        CHAR_CREATOR = new CharacterCreator(character_sheet, game.userId, character_html).render(true, { 
            width: 750,
            height: 800
        })
    });
});

Hooks.on("createItem", (type, options, id ) => {
    if( type.type != "spellcastingEntry" || !CHAR_CREATOR)
        return
    CHAR_CREATOR.set_spellcasting(type)
});  