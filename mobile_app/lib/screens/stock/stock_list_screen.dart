import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../models/stock_models.dart';
import '../../services/stock_service.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import 'stock_dialogs.dart';
import '../../widgets/modal_components.dart';

class StockListScreen extends StatefulWidget {
  const StockListScreen({super.key});

  @override
  State<StockListScreen> createState() => _StockListScreenState();
}

class _StockListScreenState extends State<StockListScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<StockItem> _stocks = [];
  StockStats? _stats;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);

    // Charger stats et stocks en parallèle
    final results = await Future.wait([
      stockService.getStats(),
      stockService.getStocks(search: _searchController.text),
    ]);

    final statsResult = results[0] as StockStatsResult;
    final stocksResult = results[1] as StockListResult;

    if (mounted) {
      setState(() {
        _loading = false;
        if (stocksResult.success) {
          _stocks = stocksResult.stocks;
          _error = null;
        } else {
          _error = stocksResult.error;
        }

        if (statsResult.success) {
          _stats = statsResult.stats;
        }
      });
    }
  }

  void _showActions(StockItem stock) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) =>
          _StockActionsSheet(stock: stock, onUpdate: _loadData),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppTheme.backgroundDark,
        elevation: 0,
        title: Text(
          'Gestion de Stock',
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: CustomScrollView(
          slivers: [
            // Stats Section
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: _buildStatsGrid(),
              ),
            ),

            // Search Bar
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                child: _buildSearchBar(),
              ),
            ),

            // Loading / Error / List
            if (_loading)
              const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_error != null)
              SliverFillRemaining(
                child: Center(
                  child: Text(
                    _error!,
                    style: const TextStyle(color: Colors.red),
                  ),
                ),
              )
            else if (_stocks.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.inventory_2_outlined,
                        size: 64,
                        color: Colors.grey[300],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Aucun stock trouvé',
                        style: GoogleFonts.inter(color: AppTheme.textSecondary),
                      ),
                    ],
                  ),
                ),
              )
            else
              SliverList(
                delegate: SliverChildBuilderDelegate((context, index) {
                  final stock = _stocks[index];
                  final authProvider = context.read<AuthProvider>();
                  final canManageStock =
                      authProvider.user?.hasPermission('change_stock') ?? false;

                  return Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 6,
                    ),
                    child: _StockListItem(
                      stock: stock,
                      onTap: canManageStock ? () => _showActions(stock) : () {},
                    ),
                  );
                }, childCount: _stocks.length),
              ),

            const SliverPadding(padding: EdgeInsets.only(bottom: 24)),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.cardShadow,
      ),
      padding: const EdgeInsets.all(4), // Petit padding pour l'esthétique
      child: ModernTextField(
        controller: _searchController,
        label: 'Recherche',
        hint: 'Rechercher un produit...',
        prefixIcon: const Icon(Icons.search, color: AppTheme.textSecondary),
        suffixIcon: _searchController.text.isNotEmpty
            ? IconButton(
                icon: const Icon(Icons.clear, color: AppTheme.textSecondary),
                onPressed: () {
                  _searchController.clear();
                  _loadData();
                  setState(() {});
                },
              )
            : null,
        onChanged: (val) {
          setState(() {}); // Update clear icon visibility
          Future.delayed(const Duration(milliseconds: 500), () {
            if (mounted && val == _searchController.text) {
              _loadData();
            }
          });
        },
      ),
    );
  }

  Widget _buildStatsGrid() {
    if (_stats == null) return const SizedBox.shrink();

    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.5,
      children: [
        _buildStatCard(
          'Valeur Achat',
          _formatCurrency(_stats!.totalValeurAchat),
          Colors.blue,
          Icons.shopping_bag_outlined,
        ),
        _buildStatCard(
          'Valeur Vente',
          _formatCurrency(_stats!.totalValeurVente),
          Colors.green,
          Icons.monetization_on_outlined,
        ),
        _buildStatCard(
          'En Rupture',
          _stats!.ruptures.toString(),
          Colors.red,
          Icons.warning_amber_rounded,
        ),
        _buildStatCard(
          'À Réappro.',
          _stats!.reappro.toString(),
          Colors.orange,
          Icons.refresh_rounded,
        ),
      ],
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    Color color,
    IconData icon,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title.toUpperCase(),
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textSecondary,
                ),
              ),
              Icon(icon, color: color.withValues(alpha: 0.5), size: 18),
            ],
          ),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              value,
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatCurrency(double value) {
    return NumberFormat.currency(
      locale: 'fr_FR',
      symbol: 'Ar',
      decimalDigits: 0,
    ).format(value);
  }
}

class _StockListItem extends StatelessWidget {
  final StockItem stock;
  final VoidCallback onTap;

  const _StockListItem({required this.stock, required this.onTap});

  @override
  Widget build(BuildContext context) {
    Color stateColor;
    Color stateBg;

    switch (stock.etat) {
      case 'EN_STOCK':
        stateColor = Colors.green;
        stateBg = Colors.green.withValues(alpha: 0.1);
        break;
      case 'LIMITE':
        stateColor = Colors.orange;
        stateBg = Colors.orange.withValues(alpha: 0.1);
        break;
      case 'RUPTURE':
      case 'RUPTURE_DE_STOCK':
        stateColor = Colors.red;
        stateBg = Colors.red.withValues(alpha: 0.1);
        break;
      default:
        stateColor = Colors.grey;
        stateBg = Colors.grey.withValues(alpha: 0.1);
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Icone produit
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryBlue.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(
                      stock.nomProduit.isNotEmpty
                          ? stock.nomProduit[0].toUpperCase()
                          : '?',
                      style: GoogleFonts.inter(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primaryBlue,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),

                // Details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        stock.nomProduit,
                        style: GoogleFonts.inter(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: stateBg,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              stock.etatDisplay,
                              style: GoogleFonts.inter(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: stateColor,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          if (stock.codeProduit != null)
                            Flexible(
                              child: Text(
                                stock.codeProduit!,
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: AppTheme.textSecondary,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Quantité
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '${stock.quantiteActuelle.toStringAsFixed(0)} ${stock.uniteMesureProduit ?? ''}',
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Min: ${stock.quantiteMinimale.toStringAsFixed(0)}',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StockActionsSheet extends StatelessWidget {
  final StockItem stock;
  final VoidCallback onUpdate;

  const _StockActionsSheet({required this.stock, required this.onUpdate});

  @override
  Widget build(BuildContext context) {
    return ModernModal(
      title: stock.nomProduit,
      heightFactor: 0.6,
      child: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 12, bottom: 8),
            child: Text(
              'Actions de stock',
              style: GoogleFonts.inter(
                fontSize: 14,
                color: AppTheme.textSecondary,
              ),
            ),
          ),

          ListTile(
            leading: const CircleAvatar(
              backgroundColor: Colors.blue,
              child: Icon(Icons.add, color: Colors.white),
            ),
            title: Text(
              'Entrée de Stock',
              style: GoogleFonts.inter(fontWeight: FontWeight.w600),
            ),
            subtitle: Text(
              'Achat fournisseur',
              style: GoogleFonts.inter(fontSize: 12),
            ),
            onTap: () async {
              final result = await showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (context) =>
                    StockEntryDialog(stock: stock, onSuccess: onUpdate),
              );
              if (result == true && context.mounted) {
                Navigator.pop(context); // Close the actions menu too
              }
            },
          ),
          const SizedBox(height: 8),
          ListTile(
            leading: const CircleAvatar(
              backgroundColor: Colors.purple,
              child: Icon(Icons.balance, color: Colors.white),
            ),
            title: Text(
              'Ajustement',
              style: GoogleFonts.inter(fontWeight: FontWeight.w600),
            ),
            subtitle: Text(
              'Correction + ou -',
              style: GoogleFonts.inter(fontSize: 12),
            ),
            onTap: () async {
              final result = await showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (context) =>
                    StockAdjustmentDialog(stock: stock, onSuccess: onUpdate),
              );
              if (result == true && context.mounted) {
                Navigator.pop(context); // Close the actions menu too
              }
            },
          ),
          const SizedBox(height: 8),
          ListTile(
            leading: const CircleAvatar(
              backgroundColor: Colors.grey,
              child: Icon(Icons.history, color: Colors.white),
            ),
            title: Text(
              'Historique',
              style: GoogleFonts.inter(fontWeight: FontWeight.w600),
            ),
            subtitle: Text(
              'Voir les mouvements',
              style: GoogleFonts.inter(fontSize: 12),
            ),
            onTap: () {
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (context) => _HistorySheet(stock: stock),
              );
            },
          ),
          const SizedBox(height: 8),
          ListTile(
            leading: const CircleAvatar(
              backgroundColor: Colors.green,
              child: Icon(Icons.attach_money, color: Colors.white),
            ),
            title: Text(
              'Réévaluation (Prix)',
              style: GoogleFonts.inter(fontWeight: FontWeight.w600),
            ),
            subtitle: Text(
              'Changer prix achat moyen',
              style: GoogleFonts.inter(fontSize: 12),
            ),
            onTap: () async {
              final result = await showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (context) =>
                    StockRevaluationDialog(stock: stock, onSuccess: onUpdate),
              );
              if (result == true && context.mounted) {
                Navigator.pop(context); // Close the actions menu too
              }
            },
          ),
        ],
      ),
    );
  }
}

class _HistorySheet extends StatefulWidget {
  final StockItem stock;
  const _HistorySheet({required this.stock});

  @override
  State<_HistorySheet> createState() => _HistorySheetState();
}

class _HistorySheetState extends State<_HistorySheet> {
  List<StockHistoryItem> _history = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    final result = await stockService.getHistory(widget.stock.id);
    if (mounted) {
      setState(() {
        _loading = false;
        if (result.success) {
          _history = result.history;
        } else {
          _error = result.error;
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return ModernModal(
      title: 'Historique',
      showBackButton: true,
      heightFactor: 0.8,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          children: [
            Text(
              widget.stock.nomProduit,
              style: GoogleFonts.inter(
                fontSize: 16,
                color: AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 16),
            const Divider(),
            if (_loading)
              const Expanded(child: Center(child: CircularProgressIndicator()))
            else if (_error != null)
              Expanded(child: Center(child: Text(_error!)))
            else if (_history.isEmpty)
              const Expanded(child: Center(child: Text('Aucun historique')))
            else
              Expanded(
                child: ListView.separated(
                  itemCount: _history.length,
                  separatorBuilder: (_, _) => const Divider(),
                  itemBuilder: (context, index) {
                    final item = _history[index];
                    final isPositive = item.quantite > 0;

                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(
                        item.typeMouvementDisplay,
                        style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                      ),
                      subtitle: Text(
                        '${DateFormat('dd/MM/yyyy HH:mm').format(item.dateMouvement)} - ${item.utilisateurNom ?? ''}\n${item.motifDisplay}',
                        style: GoogleFonts.inter(fontSize: 12),
                      ),
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '${isPositive ? '+' : ''}${item.quantite}',
                            style: GoogleFonts.inter(
                              fontWeight: FontWeight.bold,
                              color: isPositive ? Colors.green : Colors.red,
                              fontSize: 16,
                            ),
                          ),
                          Text(
                            'Stock: ${item.quantiteApres}',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}
