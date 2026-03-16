import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Award, TrendingUp, TrendingDown, Gift, AlertCircle, ShoppingCart } from 'lucide-react'
import { formatDate, formatNumber } from '@/lib/format'
import { Button } from '@/components/ui/button'

export default async function PointsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile with points
  const { data: profile } = await supabase
    .from('profiles')
    .select('points_balance, created_at')
    .eq('id', user.id)
    .single()

  // Get settings for expiration
  const { data: settings } = await supabase
    .from('settings')
    .select('points_expiration_days, points_redemption_enabled')
    .single()

  // Get points history
  const { data: pointsHistory } = await supabase
    .from('points_ledger')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const allPoints = pointsHistory || []
  const totalEarned = allPoints.filter(p => p.change > 0).reduce((sum, p) => sum + p.change, 0)
  const totalRedeemed = Math.abs(allPoints.filter(p => p.change < 0).reduce((sum, p) => sum + p.change, 0))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Puntos de Lealtad</h1>
        <p className="text-muted-foreground">
          Controla tus puntos y recompensas
        </p>
      </div>

      {/* Points Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-2 border-chart-3/30 bg-chart-3/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Puntos Disponibles</CardTitle>
            <Award className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-3">
              {formatNumber(profile?.points_balance || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Puntos listos para canjear
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ganado</CardTitle>
            <TrendingUp className="h-4 w-4 text-status-paid" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-status-paid">
              +{formatNumber(totalEarned)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Puntos ganados de por vida
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencimiento</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {settings?.points_expiration_days ? `${settings.points_expiration_days} días` : 'No configurado'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tiempo antes de que vencen los puntos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Redemption Banner */}
      {settings?.points_redemption_enabled && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">¡Canjea tus Puntos!</p>
                <p className="text-sm text-muted-foreground">Usa tus puntos para obtener descuentos en tu próxima compra</p>
              </div>
            </div>
            <Button size="sm">
              Canjear Puntos
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Points History */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Puntos</CardTitle>
          <CardDescription>
            Todas tus transacciones de puntos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allPoints.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Puntos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPoints.map((entry) => {
                  const isPositive = entry.change > 0
                  
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {formatDate(entry.created_at)}
                      </TableCell>
                      <TableCell>{entry.reason}</TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant="outline" 
                          className={isPositive 
                            ? 'bg-status-paid/10 text-status-paid border-status-paid/20' 
                            : 'bg-primary/10 text-primary border-primary/20'
                          }
                        >
                          {isPositive ? (
                            <TrendingUp className="mr-1 h-3 w-3" />
                          ) : (
                            <TrendingDown className="mr-1 h-3 w-3" />
                          )}
                          {isPositive ? '+' : ''}{formatNumber(entry.change)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">Sin puntos aún</p>
              <p className="text-muted-foreground">
                ¡Comienza a ganar puntos con tus compras!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How Points Work */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Cómo Funcionan los Puntos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-muted p-4">
              <h4 className="font-medium mb-2">Ganar Puntos</h4>
              <p className="text-sm text-muted-foreground">
                Gana 1 punto por cada $1 gastado en productos Natura. 
                Los puntos se agregan automáticamente a tu cuenta después de cada compra.
              </p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <h4 className="font-medium mb-2">Canjear Puntos</h4>
              <p className="text-sm text-muted-foreground">
                Contacta a tu consultora Natura para canjear puntos por 
                descuentos en compras futuras o recompensas exclusivas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
