'use strict;'

const
    Agenda  = require('agenda');

    agenda = new Agenda({
        db: {
            address: 'localhost:27017/agenda',
            collection: 'agendaJobs'
        }
    });

module.exports = agenda;



