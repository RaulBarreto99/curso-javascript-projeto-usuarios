class UserController {

    constructor(formId, tableId, formEditId) {

        this.formEl = document.getElementById(formId);
        this.tableEl = document.getElementById(tableId);
        this.formEditEl = document.getElementById(formEditId)

        this.onSubmit();
        this.onEdit();
        this.selectAll();
    }

    onSubmit() {

        this.formEl.addEventListener('submit', event => {

            event.preventDefault();

            let btn = this.formEl.querySelector('[type=submit]')

            btn.disabled = true;

            let values = this.getValues(this.formEl);

            if (!values) return false

            this.getPhoto(this.formEl).then((content) => {

                values.photo = content;

                values.save();

                this.addLine(values)

                this.formEl.reset()

                btn.disabled = false;


            }, (e) => {

                console.error(e)

            })

        })
    }

    onEdit() {

        document.querySelector('.btn-cancel').addEventListener('click', e => {

            this.showPanelCreate();

        })

        this.formEditEl.addEventListener('submit', event => {

            event.preventDefault();

            let btn = this.formEditEl.querySelector('[type=submit]')

            btn.disabled = true;

            let values = this.getValues(this.formEditEl);

            let index = this.formEditEl.dataset.trIndex

            let tr = this.tableEl.rows[index]

            let userOld = JSON.parse(tr.dataset.user);

            let result = Object.assign({}, userOld, values)

            this.getPhoto(this.formEditEl).then((content) => {

                if (!values.photo) {

                    result._photo = userOld._photo

                } else {
                    result._photo = content
                }

                let user = new User();

                user.loadFromJSON(result);

                user.save();

                this.getTr(user, tr)

                this.addEventsTr(tr);

                this.updateCount();

                this.formEditEl.reset();

                btn.disabled = false;

                this.showPanelCreate();

            }, (e) => {

                console.error(e)

            })

        })

    }

    getPhoto(form) {

        return new Promise((resolve, reject) => {

            let fileReader = new FileReader();

            let elements = [...form.elements].filter(item => {

                if (item.name === 'photo') {
                    return item
                }
            })

            let file = elements[0].files[0];

            fileReader.onload = () => {

                resolve(fileReader.result);
            }

            fileReader.onerror = () => {
                reject(e)
            }

            if (file) {

                fileReader.readAsDataURL(file);

            } else {
                resolve('dist/img/boxed-bg.jpg')
            }

        })


    }

    getValues(formEl) {

        let user = {};
        let isValid = true;

        [...formEl.elements].forEach(field => {

            if (['name', 'email', 'password'].indexOf(field.name) > -1 && !field.value) {

                field.parentElement.classList.add('has-error')

                isValid = false;
            }

            if (field.name == 'gender') {

                if (field.checked) {
                    user[field.name] = field.value
                }

            } else if (field.name == 'admin') {

                user[field.name] = field.checked;

            } else if (field.name == 'birth') {

                user[field.name] = new Date(field.value)

            } else {

                user[field.name] = field.value
            }

        });

        if (!isValid) {

            return false

        }

        return new User(user.name, user.gender, user.birth, user.country, user.email, user.password, user.photo, user.admin);

    }

    selectAll(){

        let users = User.getUsersStorage();
        
        users.forEach(dataUser=>{

            let user = new User();

            user.loadFromJSON(dataUser);

            this.addLine(user);

        });

    }

    addLine(dataUser) {

        let tr = this.getTr(dataUser)

        this.tableEl.appendChild(tr);

        this.updateCount()
    }

    getTr(dataUser, tr = null){

        if(tr === null) tr = document.createElement('tr');

        tr.dataset.user = JSON.stringify(dataUser);

        tr.innerHTML = `
            <td><img src="${dataUser.photo}" alt="User Image" class="img-circle img-sm"></td>
            <td>${dataUser.name}</td>
            <td>${dataUser.email}</td>
            <td>${dataUser.admin ? 'Sim' : 'Não'}</td>
            <td>${Utils.dateFormat(dataUser.register)}</td>
            <td>
            <button type="button" class="btn btn-primary btn-edit btn-xs btn-flat">Editar</button>
            <button type="button" class="btn btn-danger btn-xs btn-flat btn-delete">Excluir</button>
            </td>
        `;

        this.addEventsTr(tr);

        return tr;
    }

    addEventsTr(tr) {

        tr.querySelector('.btn-delete').addEventListener('click', e => {

            if(confirm('Deseja realmente excluir?')){

                let user = new User();

                user.loadFromJSON(JSON.parse(tr.dataset.user));

                user.remove();

                tr.remove();

                this.updateCount();
            }

        });

        tr.querySelector('.btn-edit').addEventListener('click', e => {

            let json = JSON.parse(tr.dataset.user)


            this.formEditEl.dataset.trIndex = tr.sectionRowIndex;

            for (let name in json) {

                let field = this.formEditEl.querySelector('[name=' + name.replace('_', '') + ']');


                if (field) {

                    switch (field.type) {

                        case 'file':

                            continue;

                        case 'radio':

                            field = this.formEditEl.querySelector('[name=' + name.replace('_', '') + '][value=' + json[name] + ']');
                            field.checked = true;
                            break;

                        case 'checkbox':

                            field.checked = json[name];
                            break;

                        case 'date':

                            if (json[name]) {
                                field.value = json[name].substr(0, 10);
                            } else {
                                field.value = json[name]
                            }
                            break;

                        default:

                            field.value = json[name];
                    }

                }

            }

            this.formEditEl.querySelector('.photo').src = json._photo;

            this.showPanelUpdate();

        })

    }

    showPanelCreate() {

        document.querySelector('#box-user-create').style.display = 'block'
        document.querySelector('#box-user-update').style.display = 'none'

        this.clearForm()
    }

    showPanelUpdate() {

        document.querySelector('#box-user-create').style.display = 'none'
        document.querySelector('#box-user-update').style.display = 'block'

        this.clearForm()
    }

    updateCount() {

        let numberUsers = 0;
        let numberAdmin = 0;

        [...this.tableEl.children].forEach(tr => {

            numberUsers++;

            let user = JSON.parse(tr.dataset.user)

            if (user._admin) {
                numberAdmin++
            }

        })

        document.getElementById('number-users').innerHTML = numberUsers;
        document.getElementById('number-users-admin').innerHTML = numberAdmin;
    }

    clearForm() {

        if (document.querySelector('#box-user-create').style.display == 'block') {

            this.formEditEl.reset();

        }

        if (document.querySelector('#box-user-update').style.display == 'block') {

            this.formEl.reset();

        }
    }

}