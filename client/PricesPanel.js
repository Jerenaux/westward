/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 02-12-18.
 */
function PricesPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    //this.addInterface();
}

PricesPanel.prototype = Object.create(Panel.prototype);
PricesPanel.prototype.constructor = PricesPanel;