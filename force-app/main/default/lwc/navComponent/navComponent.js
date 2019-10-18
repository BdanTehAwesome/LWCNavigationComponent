import { LightningElement,track } from 'lwc';
import {fireEvent} from 'c/eventHandler';

export default class Home extends LightningElement {

    @track selectedTab ={
        compInf:"tabSelected",
        billInf:"notSelected",
        empInf:"notSelected"
    }
    @track currentComponent="";

    clickEvent(event){
        var currentcomponent = event.target.title
        if(currentcomponent==='company') {
            this.selectedTab.compInf="tabSelected";
            this.selectedTab.billInf="notSelected";
            this.selectedTab.empInf="notSelected";
            this.to="/companyInfo"
        }
        else if(currentcomponent==='billing') {
            this.selectedTab.compInf="notSelected";
            this.selectedTab.billInf="tabSelected";
            this.selectedTab.empInf="notSelected";
            this.to="/billingInfo"
        }
        else if(currentcomponent==='employee') {
            this.selectedTab.compInf="notSelected";
            this.selectedTab.billInf="notSelected";
            this.selectedTab.empInf="tabSelected";
            this.to="/employeeInfo"
        }
        event.preventDefault();
        try {
            if(!this.to){
                throw new Error(
                    'To attribute is mandetory for navigate'
                );
            }
            this.className ="colourred";
            fireEvent('navigateTo', {to:this.to, payload:this.payload});
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error, error.stack)
        }
        event.stopPropagation();
    }
}