import { CharacterCreator } from './scripts/character-creator.js';

class CharBuilder
{
    static ID = "kiwooki-character-builder"
}

Hooks.on("init", async function () {
    CharBuilder.initialize()
    // CONFIG.debug.hooks = true;
});

Hooks.on("renderCharacterSheetPF2e", (character_sheet, character_html, css_class) => {
    // console.log(character_sheet)
    // console.log(character_html)
    // console.log(css_class)

    let header = character_html.find(`[class="header-button close"]`)
    const tooltip = game.i18n.localize('CHARACTER-CREATOR.button-title');
    header.before(
        '<button type="button" class="header-button character-creator-button" title="' + tooltip + '"><i class="fas fa-tasks"></i>' + tooltip + '</button>'
    );

    // register an event listener for this button
    character_html.on('click', '.character-creator-button', (event) => {
        // const userId = $(event.currentTarget).parents('[data-user-id]')?.data()?.userId;
        new CharacterCreator(character_sheet, game.userId, character_html).render(true, { 
            width: 750,
            height: 800
        })
    });
});