import { LightningElement, api} from 'lwc';

export default class BillingInfo extends LightningElement {
    @api payload = {};
    @api component;
}