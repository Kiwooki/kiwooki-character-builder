export class Utils {
    static logger( input )
    {
      if( CONFIG.debug.hooks == true ) //not sure why this isn't working
      {
        console.log(input)
      }
    }

    static registerHandleBarHelpers()
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
                Utils.logger("no feat for category: " + category)
                return false
            }
            for( const feat of feat_category.feats )
            {
                console.log(feat)
                if(feat.level == level && feat?.feat)
                {
                Utils.logger("found correct level")
                Utils.logger(feat.feat)
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
                Utils.logger("feats name found for category: " + category)
                return "FEAT NOT FOUND"
            }
            for( const feat of feat_category.feats )
            {
                Utils.logger(feat)
                if(feat.level == level && feat?.feat)
                {
                return feat.feat.name
                }
            }
            return "FEAT NAME FOUND"
        });
        Handlebars.registerHelper('getfeatItemID', function(character_feats, category, level, options) {
            if(!character_feats || !category || !level)
            {
                return "BLANK"
            }
            const feat_category = character_feats.get(category)
            if(!feat_category?.feats)
            {
                Utils.logger("feats not found for category: " + category)
                return "FEAT NOT FOUND"
            }
            for( const feat of feat_category.feats )
            {
                Utils.logger(feat)
                if(feat.level == level && feat?.feat)
                {
                    return feat.feat.id // .id only returns the ITEM Id not the Source ID for compendium lookup
                }
            }
            return "FEAT ID FOUND"
        });
        Handlebars.registerHelper('getfeatSourceID', function(character_feats, category, level, options) {
            if(!character_feats || !category || !level)
            {
                return "BLANK"
            }
            const feat_category = character_feats.get(category)
            if(!feat_category?.feats)
            {
                Utils.logger("feats not found for category: " + category)
                return "FEAT NOT FOUND"
            }
            for( const feat of feat_category.feats )
            {
                Utils.logger(feat)
                if(feat.level == level && feat?.feat)
                {
                    return feat.feat.sourceId // .id only returns the ITEM Id not the Source ID for compendium lookup
                }
            }
            return "FEAT ID FOUND"
        });
    }
}
  
export class OptionSelector extends FormApplication
{
    constructor(compendium_options, title, option_slot, compendium_name, character_builder)
    {
        const template_file = 'modules/kiwooki-character-builder/assets/option_select.html'
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
        Utils.logger("option picked")
        Utils.logger(ev)
        Utils.logger(ev.currentTarget.attributes[1].value)
        let option_id = ev.currentTarget.attributes[1].value
        await this.character_builder.selectedOptionClick(option_id, this.option_slot, this.compendium_name)
        this.render(false)
        this._updateObject(ev, null)
        });
    }

    async _updateObject(event, formData) {
        Utils.logger("updateObject")
        Utils.logger(event)
        Utils.logger(formData)
    }

    _canDragStart(selector) {
        console.log("selector: " + selector)
        let result = super._canDragStart(selector);
        console.log(result)
        return true
    }

    _onDragStart(event) {
        console.log("onDragStart")
        let compendium = event.target?.dataset.compName
        let doc_id = event.target?.dataset.documentId
        let uuid = "Compendium.pf2e." + compendium + "." + doc_id
        Utils.logger(uuid)
        event.dataTransfer.setData("text/plain", JSON.stringify({ type: "Item", uuid }));
    }
}  