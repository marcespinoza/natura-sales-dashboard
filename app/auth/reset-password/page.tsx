'use client'

import { Suspense } from 'react'
import ResetPasswordForm from './reset-password-form'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
      password: password,
    })

    if (updateError) {
      setError(updateError.message || 'Error al actualizar la contraseña')
    } else {
      setSuccess(true)
      setPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Recuperar Contraseña</CardTitle>
          <CardDescription>
            Ingresa tu nueva contraseña
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-green-700">
                Contraseña actualizada correctamente. Redirigiendo...
              </AlertDescription>
            </Alert>
          )}

          {!success && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nueva Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingresa tu nueva contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirma tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? <Spinner className="mr-2" /> : null}
                Actualizar Contraseña
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
