import JSONFormatter from 'json-formatter-js'
import './transferResult.html'
/* global LocalStore */

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Poll a transaction for its status after relaying into network.
function pollTransaction(thisTxId, firstPoll = false) {
  // Reset txhash on first poll.
  if(firstPoll == true) {
    console.log('setting txhash to {}')
    LocalStore.set('txhash', {})
  }

  LocalStore.set('txstatus', 'Pending')

  const grpcEndpoint = findNodeData(DEFAULT_NODES, selectedNode()).grpc
  const request = {
    query: thisTxId,
    grpc: grpcEndpoint,
  }

  if (thisTxId) {
    Meteor.call('getTxnHash', request, (err, res) => {
      if (err) {
        LocalStore.set('txhash', { error: err, id: thisTxId })
        LocalStore.set('txstatus', 'Error')
        checkResult(thisTxId)
      } else {
        res.error = null
        LocalStore.set('txhash', res)
        setRawDetail()
        checkResult(thisTxId)
      }
    })
  }
}

// Checks the result of a stored txhash object, and polls again if not completed or failed.
function checkResult(thisTxId) {
  console.log('dumping txhash')
  console.log(LocalStore.get('txhash'))

  if(LocalStore.get('txhash').transaction.header != null) {
    // Complete
    const userMessage = 'Complete - Transaction ' +
      thisTxId + ' is in block ' + LocalStore.get('txhash').transaction.header.block_number
      + ' with 1 confirmation.'

    LocalStore.set('txstatus', userMessage)
    $('.loader').hide()

  } else if(LocalStore.get('txhash').error != null) {
    // Transaction error
    const errorMessage = 'Error - ' + LocalStore.get('txhash').error
    LocalStore.set('txstatus', errorMessage)
    $('.loader').hide()

  } else {
    // Poll again
    console.log('try again in 1 seconds')
    setTimeout(function() { pollTransaction(thisTxId) }, 1000)
  }
}


function setRawDetail() {
  console.log('setting raw details')
  const myJSON = LocalStore.get('txhash').transaction
  const formatter = new JSONFormatter(myJSON)
  $('.json').html(formatter.render())
}

Template.appTransferResult.onRendered(() => {
  $('.ui.dropdown').dropdown()

  // Start polling this transcation
  pollTransaction(LocalStore.get('transactionHash'), true)
})

Template.appTransferResult.helpers({
  transactionHash() {
    const hash = LocalStore.get('transactionHash')
    return hash
  },
  transactionSignature() {
    const signature = LocalStore.get('transactionSignature')
    return signature
  },
  transactionStatus() {
    const status = LocalStore.get('txstatus')
    return status
  },
  transactionRelayedThrough() {
    const status = LocalStore.get('transactionRelayedThrough')
    return status
  }
})

Template.appTransferResult.events({
  'click .jsonclick': () => {
    if (!($('.json').html())) {
      setRawDetail()
    }
    $('.jsonbox').toggle()
  },
})
