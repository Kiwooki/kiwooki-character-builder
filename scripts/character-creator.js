import { OptionSelector } from './helpers.js';
import { Utils } from './helpers.js';

export class CharacterCreator extends FormApplication 
{
    constructor(character_sheet, owner_id, char_html) 
    {
      Utils.registerHandleBarHelpers()
      const template_file = "modules/kiwooki-character-builder/assets/character_builder.html";

      loadTemplates([
        "modules/kiwooki-character-builder/assets/sidebar.html", 
        "modules/kiwooki-character-builder/assets/settings.html", 
        "modules/kiwooki-character-builder/assets/ancestry.html",
        "modules/kiwooki-character-builder/assets/background.html", 
        "modules/kiwooki-character-builder/assets/class.html", 
        "modules/kiwooki-character-builder/assets/builder.html"]);
      let ability_boosts = [1,5,10,15,20] // fixed for all actors
      let char_level = character_sheet.actor.level
      let levels = Array.from({length: char_level}, (_, index) => index + 1);
      const template_data = { title: "Handlebars header text.",
                              ability_boosts: ability_boosts,
                              actor: character_sheet.actor,
                              tabs: [
                                      {
                                        label: "settings",
                                        title: "Settings",
                                        settings: true
                                      },
                                      { 
                                        label: "ancestry",
                                        title: "Ancestry",
                                        ancestry: true,
                                      },
                                      { 
                                        label: "background",
                                        title: "Background",
                                        background: true,
                                      },
                                      { 
                                        label: "class",
                                        title: "Class",
                                        class: true,
                                      },
                                      { 
                                        label: "builder",
                                        title: "Builder",
                                        character_level: levels,
                                        builder: true,
                                      }]
                            };
        let title_name = "Character Builder: " + character_sheet.object.name
        super( 
          template_data, 
          {
            title: title_name,
            template: template_file,
            tabs: [{navSelector: ".tabs", contentSelector: ".content", initial: "tab1"}],
            resizable: true,
          }
        );
        this.preloadFeats()
        this.preloadHeritages()
        this.owner_id = owner_id;
        this.character_sheet = character_sheet
        this.character_html = char_html
      }

      static get defaultOptions() {
        const options = super.defaultOptions;
        options.dragDrop.push({
          dropSelector: null
        },
        {
          dragSelector: ".drag-handle"
        });
        return options
      }

      async _onDrop(event)
      {
        Utils.logger("something was dropped")
        Utils.logger(event)
        let data;
        try {
          data = JSON.parse(event.dataTransfer?.getData('text/plain'))
        } catch (err)
        {
          console.log(err)
          return false
        }
        this._updateObject(event, data)
      }

      async preloadFeats() {
        this.preloaded_feats = []
        let feat_compendium = await game.packs.get("pf2e.feats-srd")
        for( const feat_entry of feat_compendium.index)
        {
          let feat = feat_compendium.getDocument(feat_entry._id)
          this.preloaded_feats.push(feat)
        }
      }

      async preloadHeritages() {
        this.preloaded_heritages = []
        let heritages_compendium = await game.packs.get("pf2e.heritages")
        for( const feat_entry of heritages_compendium.index)
        {
          let feat = await heritages_compendium.getDocument(feat_entry._id)
          this.preloaded_heritages.push(feat)
        }
      }
    
      getData(options = {}) {
        return super.getData().object; // the object from the constructor is where we are storing the data
      }
      
      activateListeners(html) {
        super.activateListeners(html);

        html.find('.option-picker-create').click( async ev => {
          let compendium_name = ev.currentTarget.attributes[1].value
          let option_type = ev.currentTarget.attributes[2].value
          let option_slot = 0
          let option_compendium = null
          if(compendium_name == "heritages")
          {
            let current_ancestry = this.character_sheet.actor.ancestry
            // Update available heritages

            let filtered_heritages = []
            for( const temp_heritage of this.preloaded_heritages )
            {
              if( !temp_heritage.system.ancestry || temp_heritage.system.ancestry.name == current_ancestry.name)
              {
                filtered_heritages.push(temp_heritage)
              }
            }
            option_compendium = filtered_heritages
          }
          else
          {
            option_compendium = await game.packs.get("pf2e." + compendium_name)
            option_compendium = option_compendium.index
          }
          new OptionSelector(option_compendium, "Select new " + option_type, option_slot, compendium_name, this).render(true, { 
            width: 350,
            height: 1131,
            top: 70,
            left: 120,
            z_index: 111
          })
        });
        html.find('.open_compendium').click( async ev => {
          let compendium_name = ev.currentTarget.attributes[1].value
          // let search = '[class="open-compendium"][data-compendium="' + compendium_name + '"]'
          // let button = this.character_html.find(search)[0]
          game.packs.get(compendium_name).render(true)
          Utils.logger(button)
          // button.click(ev)
        });
        html.find('.preview_option').click( async ev => {
          this.preview_option(ev)
        });
        html.find('.select_ability_boosts').click( async ev => {
          let button = this.character_html.find('[data-action=edit-ability-scores]')[0]
          button.click(ev)
        });
        html.find('.add_spellcasting').click( async ev => {
          let button = this.character_html.find('[data-action=spellcasting-create]')[0]
          button.click(ev)
        });
        html.find('.pick-new-feat-select').click( async ev => {
          // feattype-ancestry,traits-{{@root.actor.system.details.ancestry.trait}},conjunction-or
          if (!(ev.currentTarget instanceof HTMLElement)) return;
          const maxLevel = Number(ev.currentTarget.dataset.level) || this.actor.level;
          const button = ev.currentTarget;
          const checkboxesFilterCodes = button.dataset.filter?.split(",").filter((f) => !!f) ?? [];
          const feattype = [];
          const traits = [];
          for (const filterCode of checkboxesFilterCodes) {
            Utils.logger(filterCode)
              const [filterType, value] = filterCode.split("-");
              if (!(filterType && value)) {
                  const codesData = JSON.stringify(checkboxesFilterCodes);
                  Utils.logger(`Invalid filter value for opening the compendium browser:\n${codesData}`);
                  return
              }
              if (filterType === "feattype") {
                  feattype.push(value);
              } else if (filterType === "traits") {
                  traits.push(value)
              } else if (filterType === "conjunction" && (value === "and" || value === "or")) {
                  traits.conjunction = value;
              }
          }
          const filter = { level: { max: maxLevel }, feattype, traits };
          await game.pf2e.compendiumBrowser.openTab("feat", filter)
        });
        html.find('.level-accordion').click( async ev => {
          /* Toggle between adding and removing the "active" class,
          to highlight the button that controls the panel */
          ev.currentTarget.classList.toggle("level-active");

          /* Toggle between hiding and showing the active panel */
          var panel = ev.currentTarget.nextElementSibling;
          if (panel.style.display === "block") {
            panel.style.display = "none";
          } else {
            panel.style.display = "block";
          }
          // this.render(true)
        });
      }
    
      async preview_option( ev )
      {
        Utils.logger("preview_option")
        Utils.logger(ev)
        let option_uuid = ev.currentTarget.attributes[1].value
        let compendium_name = ev.currentTarget.attributes[2].value
        Utils.logger("UUID: " + option_uuid)
        Utils.logger("Compendium Name: " + compendium_name)
        // Change to .get() for feats?
        let option_to_preview = null
        if(option_uuid.includes("Compendium"))
        {
          option_uuid = option_uuid.split(".")[3]
          Utils.logger("option UUID: " + option_uuid)
          // option_to_preview = await game.packs.get("pf2e." + compendium_name).get(option_uuid)
        }
        option_to_preview = await game.packs.get("pf2e." + compendium_name).getDocument(option_uuid)  
        Utils.logger(option_to_preview)
        option_to_preview.sheet.render(true)
      }

      async selectedOptionClick(option_id, option_slot)
      {
        let option = null
        let source = null

        let category = option_slot?.categoryId
        let slot = option_slot?.slotId
        let option_types = option_id.split(".")
        const compendium_name = option_types[1] + "." + option_types[2]
        option_id = option_id.split(".")[3]
        option = await game.packs.get(compendium_name).getDocument(option_id)
        source = option.toObject()
        if(compendium_name == "pf2e.feats-srd")
        {
          let feat_type = option.system.featType.value
          source.system.location = feat_type + "-" + slot.toString()
        }
        else
        {
          source.flags = mergeObject(source.flags ?? {}, {core: {sourceId: option_id} })
        }
        Utils.logger(source)
        let item_response = await this.character_sheet.actor.createEmbeddedDocuments("Item", [source] )
        let data = super.getData().object
        data.actor = this.character_sheet.actor
        this.render(true) // update this
        game.pf2e.compendiumBrowser.close() // make sure compendium browser is closed
      }

      getNearestFeatSlotId(target) {
        const categoryId = target?.dataset.categoryId;
        const slotId = target?.dataset.slotId;
        return typeof categoryId === "string" ? { slotId, categoryId: categoryId } : null;
      }

      async _updateObject(event, formData) {
        console.log(formData)
        const featSlot = this.getNearestFeatSlotId(event.target) ?? { categoryId: "" };
        return this.selectedOptionClick(formData.uuid, featSlot)
      }
}