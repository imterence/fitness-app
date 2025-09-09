declare global {
  interface Window {
    paypal: {
      Buttons: (config: any) => {
        render: (container: string) => void
      }
    }
  }
}

export {}













