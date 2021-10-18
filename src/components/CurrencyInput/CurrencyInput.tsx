import React, { useState } from 'react';
import { Currency } from '@uniswap/sdk'
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useCurrencyBalance } from 'state/wallet/hooks';
import cx from 'classnames';
import { CurrencySearchModal, CurrencyLogo } from 'components';
import { useActiveWeb3React } from 'hooks';

const useStyles = makeStyles(({ palette, breakpoints }) => ({
  swapBox: {
    padding: '16px 24px',
    borderRadius: 10,
    background: '#282d3d',
    zIndex: 1,
    position: 'relative',
    textAlign: 'left',
    '& > p': {
      fontSize: 14,
      marginBottom: 16,
    },
    '& > div': {
      display: 'flex',
      alignItems: 'center',
      '& .inputWrapper': {
        flex: 1,
        position: 'relative',
        paddingLeft: 8
      },
      '& .maxWrapper': {
        paddingLeft: 8,
        cursor: 'pointer',
        '& p': {
          color: '#448aff',
          fontWeight: 600
        }
      },
      '& input': {
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        outline: 'none',
        textAlign: 'right',
        color: '#696c80',
        width: '100%',
        fontSize: 18,
        fontWeight: 600,
        '&::placeholder': {
          color: '#696c80'
        }
      }
    },
    [breakpoints.down('xs')]: {
      padding: 12
    }
  },
  currencyButton: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: 38,
    '& img': {
      borderRadius: 16,
      marginRight: 4,
    },
  },
  noCurrency: {
    backgroundImage: 'linear-gradient(105deg, #448aff 3%, #004ce6)'
  },
  currencySelected: {
    backgroundColor: '#404557'
  },
  balanceSection: {
    '& p': {
      color: '#696c80'
    }
  }
}));

interface CurrencyInputProps {
  title?: string,
  handleCurrencySelect: (currency: Currency) => void
  currency: Currency | undefined
  otherCurrency?: Currency | undefined
  amount: string
  setAmount: (value: string) => void
  onMax?: () => void
  showMaxButton?: boolean
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({ handleCurrencySelect, currency, otherCurrency, amount, setAmount, onMax, showMaxButton, title }) => {
  const classes = useStyles();
  const [modalOpen, setModalOpen] = useState(false);
  const { account } = useActiveWeb3React();
  const selectedCurrencyBalance = useCurrencyBalance(account ?? undefined, currency ?? undefined)

  return (
    <Box className={classes.swapBox}>
      <Box display='flex' justifyContent='space-between' mb={2}>
        <Typography>{ title || 'You Pay:' }</Typography>
        {account && currency && showMaxButton && (
          <Box className='maxWrapper' onClick={onMax}>
            <Typography variant='body2'>MAX</Typography>
          </Box>
        )}
      </Box>
      <Box mb={2}>
        <Box className={cx(classes.currencyButton, currency ? classes.currencySelected :  classes.noCurrency)} onClick={() => { setModalOpen(true) }}>
          {
            currency ?
              <>
              <CurrencyLogo currency={currency} size={'28px'} />
              <Typography variant='body1'>{ currency?.symbol }</Typography>
              </>
              :
              <Typography variant='body1'>Select a token</Typography>
          }
        </Box>
        <Box className='inputWrapper'>
          <input value={amount} placeholder='0.00' onChange={(e) => setAmount(e.target.value)} />
        </Box>
      </Box>
      <Box display='flex' justifyContent='space-between' className={classes.balanceSection}>
        <Typography variant='body2'>Balance: { selectedCurrencyBalance ? selectedCurrencyBalance.toSignificant(6) : 0 }</Typography>
        <Typography variant='body2'>$0</Typography>
      </Box>
      <CurrencySearchModal
        isOpen={modalOpen}
        onDismiss={() => { setModalOpen(false) }}
        onCurrencySelect={handleCurrencySelect}
        selectedCurrency={currency}
        otherSelectedCurrency={otherCurrency}
      />
    </Box>
  )
}

export default CurrencyInput;