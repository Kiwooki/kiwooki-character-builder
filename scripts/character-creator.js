import { OptionSelector } from './helpers.js';
import { Utils } from './helpers.js';

export class CharacterCreator extends FormApplication 
{
    constructor(character_sheet, owner_id, char_html) 
    {
      Utils.registerHandleBarHelpers()
      const template_file = "modules/kiwooki-character-builder/assets/character_builder.html";

      loadTemplates([
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
        this.spell_array = null
        this.set_spellcasting = this.empty

        this.class_spellcasting_map = {
          "bard": [{
              name: "",
              type: "Spontaneous",
              tradition: "Occult",
              ability: "Charisma",
              spell_array: []
            },{
              name: "",
              type: "Focus",
              tradition: "Occult",
              ability: "Charisma",
              spell_array: Array(11).fill('-')
            }],
          "champion": [{
              name: "",
              type: "Focus",
              tradition: "Divine",
              ability: "Charisma",
              spell_array: Array(11).fill('-')
            }],
          "cleric": [{
              name: "Divine Prepared Spells",
              type: "Prepared",
              tradition: "Divine",
              ability: "Wisdom",
              spell_array: []
            },{
              name: "Divine Font",
              type: "Prepared",
              tradition: "Divine",
              ability: "Wisdom",
              spell_array: [] // TODO fix this.
            }],
          "druid": [{
              name: "Primal Prepared Spells",
              type: "Prepared",
              tradition: "Primal",
              ability: "Wisdom",
              spell_array: []
            },{
              name: "Primal Focus Spells",
              type: "Focus",
              tradition: "Primal",
              ability: "Wisdom",
              spell_array: Array(11).fill('-')
            }],
          "magus": [{
              name: "Arcane Prepared Spells",
              type: "Prepared",
              tradition: "Arcane",
              ability: "Intelligence",
              spell_array: []
            },{
              name: "Arcane Focus Spells",
              type: "Focus",
              tradition: "Arcane",
              ability: "Intelligence",
              spell_array: Array(11).fill('-')
            }],
          "oracle": [{
              name: "Divine Spontaneous Spells",
              type: "Spontaneous",
              tradition: "Divine",
              ability: "Charisma",
              spell_array: []
            },{
              name: "Divine Focus Spells",
              type: "Focus",
              tradition: "Divine",
              ability: "Charisma",
              spell_array: Array(11).fill('-')
            }],
          "psychic": [{
              name: "Prepared Occult Spells",
              type: "Prepared",
              tradition: "Occult",
              ability: "Intelligence",
              spell_array: []
            }],
          "sorcerer": [{
              name: "Arcane Spontaneous Spells",
              type: "Spontaneous",
              tradition: "Arcane",
              ability: "Charisma",
              spell_array: []
            },{
              name: "Arcane Focus Spells",
              type: "Focus",
              tradition: "Arcane",
              ability: "Charisma",
              spell_array: Array(11).fill('-')
            }],
          "witch": [{
              name: "Occult Prepared Spells",
              type: "Prepared",
              tradition: "Occult",
              ability: "Intelligence",
              spell_array: []
            },{
              name: "Occult Focus Spells",
              type: "Focus",
              tradition: "Occult",
              ability: "Intelligence",
              spell_array: Array(11).fill('-')
            }],
          "wizard": [{
              name: "Arcane Prepared Spells",
              type: "Prepared",
              tradition: "Arcane",
              ability: "Intelligence",
              spell_array: []
            },{
              name: "Arcane Focus Spells",
              type: "Focus",
              tradition: "Arcane",
              ability: "Intelligence",
              spell_array: Array(11).fill('-')
            }],
        }
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
          let compendium_name = ev.currentTarget?.dataset.compName
          let option_type = ev.currentTarget?.dataset.optType
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
          let compendium_name = ev.currentTarget?.dataset.compName
          game.packs.get(compendium_name).render(true)
        });
        html.find('.preview_option').click( async ev => {
          this.preview_option(ev)
        });
        html.find('.skill-to-train').click( async ev => {
          if(ev.target?.className == "train_skill")
          {
            let skill_keys = {
              acrobatics: "acr",
              arcana: "arc",
              athletics: "ath",
              crafting: "cra",
              deception: "dec",
              diplomacy: "dip",
              intimidation: "itm",
              medicine: "med",
              nature: "nat",
              occultism: "occ",
              performance: "prf",
              religion: "rel",
              society: "soc",
              stealth: "ste",
              survival: "sur",
              thievery: "thi",  
            } // TODO get keys from system
            let select_td = ev.currentTarget.children[1]
            let selected = select_td.children[0].value
            let key = skill_keys[selected]
            let rank = this.character_sheet.actor.system.skills[key].rank
            let newValue = Math.ceil(rank + 1, 4)
            let propertyKey = "system.skills." + key + ".rank"
            await this.character_sheet.actor.update({ [propertyKey]: newValue });
            this.render(true)
          }
        });
        html.find('.select_ability_boosts').click( async ev => {
          let button = this.character_html.find('[data-action=edit-ability-scores]')[0]
          button.click(ev)
        });
        html.find('.add_spellcasting').click( async ev => {

          // get spellcasting table
          let actor_html = this.character_sheet.actor.class.system.description.value
          let whole_html = game.pf2e.TextEditor.enrichHTML(actor_html, {
              async: false
          })

          let parser = new DOMParser();
          const doc = parser.parseFromString(whole_html, 'text/html');
          Utils.logger(doc)
          let tables = doc.getElementsByTagName("table")
          let spell_table = tables[1] // second one is spellcasting
          const this_class = this.character_sheet.actor.class.system.slug
          let spell_entries = this.class_spellcasting_map[this_class]
          this.configure_spellcasting()
          for( const entry of spell_entries )
          {
            console.log(entry)
            this.spellcasting_configured = false
            this.spellcasting_name = entry.name
            this.spell_array = entry.spell_array
            if( entry.spell_array.length === 0 )
            {
              this.spell_array = [...spell_table.rows].map(r => [...r.querySelectorAll('td, th')].map(td => td.textContent))[this.character_sheet.actor.level]
            }
            console.log("Spell Array: ", this.spell_array)
            if( entry.name == "Divine Font") // TODO remove this
            {
              for( let i = 0; i < 11; i++ )
              {
                let tmp_entry = this.spell_array[i]
                console.log("tmp_entry: ", tmp_entry)
                if( tmp_entry == "-" || tmp_entry == "" )
                {
                  continue
                }
                if( tmp_entry.includes("*"))
                {
                  this.spell_array[i] = 1 + this.character_sheet.actor.system.abilities.cha.mod
                }
                else
                {
                  this.spell_array[i] = 0
                }
              }
            }
            console.log("Final Spell Array: ", this.spell_array)
            this.createSpellcastingEntry(this.character_html, ev, entry.type, entry.tradition, entry.ability)
            await this.until(_ => this.spellcasting_configured == true);
          }
          this.set_spellcasting = this.empty
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
        });
      }
    
      async createSpellcastingEntry( character_html, ev, type, tradition, ability )
      {
        let button = character_html.find('[data-action=spellcasting-create]')[0]
        button.click(ev)
        await new Promise(r => setTimeout(r, 500)); // for slow to popup windows. syncing with the button await would be better
        Object.values(ui.windows).forEach( val => 
          { 
            if(val?.object?.type == "spellcastingEntry") 
            { 
              // Spellcasting Type
              for( let i = 0; i < 6; i++)
              {
                if( val.form[0][i].label == type )
                {
                  val.form[0].selectedIndex = i
                }
              }
              // Tradition
              for( let i = 0; i < 4; i++)
              {
                if( val.form[1][i].label == tradition )
                {
                  val.form[1].selectedIndex = i
                }
              }
              // Ability
              for( let i = 0; i < 6; i++)
              {
                if( val.form[3][i].label == ability )
                {
                  val.form[3].selectedIndex = i
                }
              }
              val.form[4].click() 
            } 
          })
      }

      until(conditionFunction) {

        const poll = resolve => {
          if(conditionFunction()) resolve();
          else setTimeout(_ => poll(resolve), 400);
        }
      
        return new Promise(poll);
      }

      empty(type)
      {
        console.log("do nothing: ", type)
      }

      configure_spellcasting()
      {
        this.set_spellcasting = this.set_class_spellcasting
      }

      set_class_spellcasting(type)
      {
        console.log("set class spellcasting")
        let character_sheet = this.character_sheet
        let spellcasting = character_sheet.actor.spellcasting.get(type._id.toString())
        let spell_level = this.spell_array
        for( let i = 0; i < 10; i++ )
        {
            let slot_name = "slot" + (i).toString()
            let next_val = spell_level[i + 1]
            if( next_val == "-" )
                continue
            let system_slots = {}
            system_slots[slot_name] = { max: parseInt(next_val), value: parseInt(next_val) }
            spellcasting.update( 
            {
                _id: "something",
                system: {
                    slots: system_slots
                }
            });
        }
        if( this.spellcasting_name != "")
        {
          spellcasting.update(
          {
            _id: "name_update",
            name: this.spellcasting_name
          });
        }
        console.log("hopefully this prints second to last.")
        this.spellcasting_configured = true
      }

      async preview_option( ev )
      {
        Utils.logger("preview_option")
        Utils.logger(ev)
        let option_uuid = ev.currentTarget?.dataset.documentId
        let compendium_name = ev.currentTarget?.dataset.compName
        Utils.logger("UUID: " + option_uuid)
        Utils.logger("Compendium Name: " + compendium_name)
        // Change to .get() for feats?
        let option_to_preview = null
        if(option_uuid.includes("Compendium"))
        {
          option_uuid = option_uuid.split(".")[3]
        }
        if(ev.target?.className == "remove_feat")
        {
          // if remove_feat - get id from actor/character
          Utils.logger(this.character_sheet.actor)
          let item_id = ev.currentTarget?.dataset.itemId
          Utils.logger(item_id)
          await this.character_sheet.actor.deleteEmbeddedDocuments("Item", [item_id]);
          this.render(true) // update this
          return
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