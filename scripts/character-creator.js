class OptionSelector extends FormApplication
{
  constructor(compendium_options, title, option_slot, compendium_name, character_builder)
  {
    const template_file = 'modules/handy-hints/assets/option_select.html'
    const template_data = {
      title: title,
      compendium_options: compendium_options,
      compendium_name: compendium_name
    }
    super( 
      template_data, 
      {
        title: title,
        template: template_file,
        resizable: true,
      }
    );
    this.character_builder = character_builder
    this.option_slot = option_slot
    this.compendium_name = compendium_name
  }

  static get defaultOptions() {
    const options = super.defaultOptions;
    options.dragDrop.push(
      {
        dragSelector: ".directory-item",
        dropSelector: null
      }
    );
    return options
  }

  getData(options = {}) {
    return super.getData().object; // the object from the constructor is where we are storing the data
  }
      
  activateListeners(html) {
    super.activateListeners(html);
    html.find('.preview-option').click( async ev => {
      this.character_builder.preview_option(ev)
    });
    html.find('.chosen-option').click( async ev => {
      // console.log("option picked")
      // console.log(ev)
      // console.log(ev.currentTarget.attributes[1].value)
      let option_id = ev.currentTarget.attributes[1].value
      await this.character_builder.selectedOptionClick(option_id, this.option_slot, this.compendium_name)
      this.render(false)
      this._updateObject(ev, null)
    });
  }

  async _updateObject(event, formData) {
    // console.log("updateObject")
    // console.log(event)
    // console.log(formData)
  }

  async _onDragStart(event) {
    let compendium = event.target?.dataset.compName
    let doc_id = event.target?.dataset.documentId
    let uuid = "Compendium.pf2e." + compendium + "." + doc_id
    event.dataTransfer.setData("text/plain", JSON.stringify({ type: "Item", uuid }));
  }
}

export class CharacterCreator extends FormApplication 
{
    constructor(character_sheet, owner_id, char_html) 
    {
      Handlebars.registerHelper('ifCompare', function(v1, v2, options) {
        if(!v1 || !v2)
        {
          return false
        }
        if(v1 === v2) {
          return options.fn(this);
        }
        return options.inverse(this);
      });
      Handlebars.registerHelper('hasSpellCasting', function(actor, options) {
        if(!actor)
        {
          return false
        }
        // if actor doesn't have spellcasting, return false
        return true
      });
      Handlebars.registerHelper('getAncestryTraits', function(actor, options) {
        if(!actor)
        {
          return ""
        }
        // if actor doesn't have spellcasting, return false
        let ancestry_traits = ""
        if( actor.ancestry )
        {
          ancestry_traits += "traits-" + actor.system.details.ancestry.trait
        }
        if( actor.heritage && actor.system.details.heritage.trait)
        {
          ancestry_traits += ",traits-" + actor.system.details.heritage.trait
        }
        return ancestry_traits
      });
      Handlebars.registerHelper('gt', function(v1, v2, options) {
        if(!v1 || !v2)
        {
          return false
        }
        return v1 > v2
      });
      Handlebars.registerHelper('enrichHTML', function(v1, options) {
        if(!v1)
        {
          return v1
        }
        let res = game.pf2e.TextEditor.enrichHTML(v1, {
          async: false
        })
        return res
      });
      Handlebars.registerHelper('hasfeat', function(character_feats, category, level, options) {
        if(!character_feats || !category || !level)
        {
          return false
        }
        const feat_category = character_feats.get(category)
        if(!feat_category?.feats)
        {
          // console.log("no feat for category: " + category)
          return false
        }
        for( const feat of feat_category.feats )
        {
          console.log(feat)
          if(feat.level == level && feat?.feat)
          {
            // console.log("found correct level")
            // console.log(feat.feat)
            return true
          }
        }
        return false
      });
      Handlebars.registerHelper('getfeatName', function(character_feats, category, level, options) {
        if(!character_feats || !category || !level)
        {
          return "BLANK"
        }
        const feat_category = character_feats.get(category)
        if(!feat_category?.feats)
        {
          // console.log("feats name found for category: " + category)
          return "FEAT NOT FOUND"
        }
        for( const feat of feat_category.feats )
        {
          // console.log(feat)
          if(feat.level == level && feat?.feat)
          {
            return feat.feat.name
          }
        }
        return "FEAT NAME FOUND"
      });
      Handlebars.registerHelper('getfeatID', function(character_feats, category, level, options) {
        if(!character_feats || !category || !level)
        {
          return "BLANK"
        }
        const feat_category = character_feats.get(category)
        if(!feat_category?.feats)
        {
          // console.log("feats not found for category: " + category)
          return "FEAT NOT FOUND"
        }
        for( const feat of feat_category.feats )
        {
          // console.log(feat)
          if(feat.level == level && feat?.feat)
          {
            return feat.feat.sourceId // .id only returns the ITEM Id not the Source ID for compendium lookup
          }
        }
        return "FEAT ID FOUND"
      });
      const template_file = "modules/handy-hints/assets/character_builder.html";

      loadTemplates([
        "modules/handy-hints/assets/sidebar.html", 
        "modules/handy-hints/assets/settings.html", 
        "modules/handy-hints/assets/ancestry.html",
        "modules/handy-hints/assets/background.html", 
        "modules/handy-hints/assets/class.html", 
        "modules/handy-hints/assets/builder.html"]);
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
        // console.log("something was dropped")
        // console.log(event)
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
          // console.log(button)
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
            // console.log(filterCode)
              const [filterType, value] = filterCode.split("-");
              if (!(filterType && value)) {
                  const codesData = JSON.stringify(checkboxesFilterCodes);
                  // console.log(`Invalid filter value for opening the compendium browser:\n${codesData}`);
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
        // console.log("preview_option")
        // console.log(ev)
        let option_uuid = ev.currentTarget.attributes[1].value
        let compendium_name = ev.currentTarget.attributes[2].value
        // console.log("UUID: " + option_uuid)
        // console.log("Compendium Name: " + compendium_name)
        // Change to .get() for feats?
        let option_to_preview = null
        if(option_uuid.includes("Compendium"))
        {
          option_uuid = option_uuid.split(".")[3]
          // console.log("option UUID: " + option_uuid)
          // option_to_preview = await game.packs.get("pf2e." + compendium_name).get(option_uuid)
        }
        option_to_preview = await game.packs.get("pf2e." + compendium_name).getDocument(option_uuid)  
        // console.log(option_to_preview)
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
          // option_id = option_id.split(".")[3]
          // option = await game.packs.get(compendium_name).get(option_id)
          // source = option.toObject()
          let feat_type = option.system.featType.value
          source.system.location = feat_type + "-" + slot.toString()
        }
        else
        {
          // option_id = option_id.split(".")[3]
          // option = await game.packs.get(compendium_name).getDocument(option_id)
          // source = option.toObject()
          source.flags = mergeObject(source.flags ?? {}, {core: {sourceId: option_id} })
          // if( compendium_name.includes("ancestries"))
          // {
          //   let current_ancestry = this.character_html.actor.ancestry
          //   // Update available heritages
          //   this.heritages_compendium = game.packs.get("pf2e.heritages") // reload all
          //   let filtered_heritages = []
          //   for( const temp_heritage of this.heritages_compendium.index )
          //   {
          //     let current_heritage = await this.heritages_compendium.getDocument(temp_heritage._id)
          //     if( !current_heritage.system.ancestry || current_heritage.system.ancestry.name == current_ancestry.name)
          //     {
          //       filtered_heritages.push(current_heritage)
          //     }
          //   }
          //   this.heritages_compendium = filtered_heritages
          // }
        }
        // console.log(source)
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