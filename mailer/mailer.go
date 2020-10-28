package mailer

import (
	"bytes"
	"crypto/tls"
	"fmt"
	"html/template"

	log "github.com/sirupsen/logrus"
	gomail "gopkg.in/gomail.v2"

	"github.com/aerospike-community/amc/common"
)

func processTemplate(config *common.Config, tplName string, context interface{}) ([]byte, error) {

	defer func() {
		if r := recover(); r != nil {
			log.Error("Sending email failed with a panic: ", r)
		}
	}()

	t := template.Must(template.ParseFiles(config.Mailer.TemplatePath+"/"+tplName, config.Mailer.TemplatePath+"/base.html"))

	// Execute the template for each recipient.
	data := bytes.Buffer{}
	err := t.Execute(&data, context)
	if err != nil {
		log.Errorf("Error executing template `%s`, err: `%s`.", tplName, err)
		return nil, err
	}

	return data.Bytes(), nil
}

func SendMail(config *common.Config, tplName, subject string, context interface{}) error {
	body, err := processTemplate(config, tplName, context)
	if err != nil {
		return err
	}

	msg := gomail.NewMessage(gomail.SetEncoding(gomail.Unencoded))
	msg.SetHeader("From", fmt.Sprintf("AMC <%s>", config.FromAddress()))
	msg.SetHeader("To", config.AlertEmails()...)
	msg.SetHeader("Subject", subject)
	msg.SetBody("text/html", string(body))

	mailer := gomail.NewDialer(config.Mailer.Host, int(config.Mailer.Port), config.Mailer.User, config.Mailer.Password)
	// Allow invalid/self-signed certs if requested by user
	if config.Mailer.AcceptInvalidCert {
		if mailer.TLSConfig != nil {
			mailer.TLSConfig.InsecureSkipVerify = true
		} else {
			mailer.TLSConfig = &tls.Config{InsecureSkipVerify: true}
		}
	}
	if err := mailer.DialAndSend(msg); err != nil {
		return err
	}

	return nil
}
