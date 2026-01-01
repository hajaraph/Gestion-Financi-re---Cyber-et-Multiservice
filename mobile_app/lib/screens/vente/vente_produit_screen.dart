import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../models/produit_models.dart';
import '../../services/vente_produit_service.dart';
import '../../widgets/modal_components.dart';

/// Écran de vente de produits (Point de Vente)
class VenteProduitScreen extends StatefulWidget {
  const VenteProduitScreen({super.key});

  @override
  State<VenteProduitScreen> createState() => _VenteProduitScreenState();
}

class _VenteProduitScreenState extends State<VenteProduitScreen> {
  // États
  List<Produit> _produits = [];
  List<VenteProduit> _recentSales = [];
  bool _loadingProduits = true;
  bool _loadingSales = true;
  String _searchTerm = '';
  String? _error;

  // Contrôleurs
  final TextEditingController _searchController = TextEditingController();

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
    await Future.wait([_loadProduits(), _loadRecentSales()]);
  }

  Future<void> _loadProduits() async {
    setState(() => _loadingProduits = true);

    final result = await venteProduitService.getProduits(
      search: _searchTerm.isNotEmpty ? _searchTerm : null,
    );

    setState(() {
      _loadingProduits = false;
      if (result.success) {
        _produits = result.produits;
        _error = null;
      } else {
        _error = result.error;
      }
    });
  }

  Future<void> _loadRecentSales() async {
    setState(() => _loadingSales = true);

    final result = await venteProduitService.getVentes(page: 1, pageSize: 10);

    setState(() {
      _loadingSales = false;
      if (result.success) {
        _recentSales = result.ventes;
      }
    });
  }

  void _onSearch(String value) {
    _searchTerm = value;
    _loadProduits();
  }

  void _showVenteDialog(Produit produit) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _VenteBottomSheet(
        produit: produit,
        onSuccess: () {
          _loadData();
          showModernSnackBar(
            context,
            message: 'Vente enregistrée avec succès !',
            type: SnackBarType.success,
          );
        },
        onError: (error) {
          showModernSnackBar(context, message: error, type: SnackBarType.error);
        },
      ),
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
          'Point de Vente',
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white70),
            onPressed: _loadData,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: AppTheme.primaryBlue,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Text(
                'Vente Directe',
                style: GoogleFonts.inter(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Sélectionnez un produit pour effectuer une vente',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: AppTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 20),

              // Barre de recherche
              _buildSearchBar(),
              const SizedBox(height: 20),

              // Liste des produits
              _buildProduitsSection(),
              const SizedBox(height: 24),

              // Ventes récentes
              _buildRecentSalesSection(),
            ],
          ),
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
      padding: const EdgeInsets.all(4),
      child: ModernTextField(
        controller: _searchController,
        label: 'Recherche',
        hint: 'Rechercher un produit...',
        prefixIcon: const Icon(Icons.search, color: AppTheme.textSecondary),
        suffixIcon: _searchTerm.isNotEmpty
            ? IconButton(
                icon: const Icon(Icons.clear, color: AppTheme.textSecondary),
                onPressed: () {
                  _searchController.clear();
                  _onSearch('');
                },
              )
            : null,
        onChanged: _onSearch,
      ),
    );
  }

  Widget _buildProduitsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 4,
              height: 20,
              decoration: BoxDecoration(
                color: AppTheme.primaryBlue,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              'Produits en Stock',
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        if (_loadingProduits)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: CircularProgressIndicator(color: AppTheme.primaryBlue),
            ),
          )
        else if (_error != null)
          _buildErrorWidget(_error!)
        else if (_produits.isEmpty)
          _buildEmptyWidget('Aucun produit trouvé')
        else
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 1.1,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            itemCount: _produits.length > 6 ? 6 : _produits.length,
            itemBuilder: (context, index) {
              return _ProduitCard(
                produit: _produits[index],
                onTap: () => _showVenteDialog(_produits[index]),
              );
            },
          ),

        if (_produits.length > 6)
          Center(
            child: TextButton(
              onPressed: () {
                // Fonctionnalité à implémenter
              },
              child: Text(
                'Voir tous les produits (${_produits.length})',
                style: GoogleFonts.inter(
                  color: AppTheme.primaryBlue,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildRecentSalesSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 4,
                height: 20,
                decoration: BoxDecoration(
                  color: AppTheme.success,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'Ventes Récentes',
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          if (_loadingSales)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: CircularProgressIndicator(color: AppTheme.primaryBlue),
              ),
            )
          else if (_recentSales.isEmpty)
            Padding(
              padding: const EdgeInsets.all(24),
              child: Center(
                child: Text(
                  'Aucune vente récente',
                  style: GoogleFonts.inter(color: AppTheme.textSecondary),
                ),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _recentSales.length > 5 ? 5 : _recentSales.length,
              separatorBuilder: (_, _) => const Divider(height: 1),
              itemBuilder: (context, index) {
                return _SaleItem(vente: _recentSales[index]);
              },
            ),
        ],
      ),
    );
  }

  Widget _buildErrorWidget(String error) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppTheme.error.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(Icons.error_outline, color: AppTheme.error, size: 40),
          const SizedBox(height: 8),
          Text(
            error,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(color: AppTheme.error),
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: _loadProduits,
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error),
            child: const Text(
              'Réessayer',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyWidget(String message) {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Center(
        child: Column(
          children: [
            Icon(
              Icons.inventory_2_outlined,
              color: AppTheme.textSecondary,
              size: 48,
            ),
            const SizedBox(height: 8),
            Text(
              message,
              style: GoogleFonts.inter(color: AppTheme.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}

// =============================================================================
// Widgets privés
// =============================================================================

/// Carte de produit
class _ProduitCard extends StatelessWidget {
  final Produit produit;
  final VoidCallback onTap;

  const _ProduitCard({required this.produit, required this.onTap});

  String _formatCurrency(double value) {
    return NumberFormat.currency(
      locale: 'fr_FR',
      symbol: 'Ar',
      decimalDigits: 0,
    ).format(value);
  }

  @override
  Widget build(BuildContext context) {
    final isLowStock = produit.stock.isLowStock;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isLowStock
                ? AppTheme.error.withValues(alpha: 0.3)
                : Colors.grey.shade200,
          ),
          boxShadow: AppTheme.cardShadow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    produit.designation,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (produit.categorieNom != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      produit.categorieNom!,
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: isLowStock
                        ? AppTheme.error.withValues(alpha: 0.1)
                        : AppTheme.success.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    '${produit.stock.quantiteActuelle.toInt()} ${produit.uniteMesureSymbole ?? ''}',
                    style: GoogleFonts.inter(
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      color: isLowStock ? AppTheme.error : AppTheme.success,
                    ),
                  ),
                ),
                Text(
                  _formatCurrency(produit.prixVente),
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryBlue,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Item de vente récente
class _SaleItem extends StatelessWidget {
  final VenteProduit vente;

  const _SaleItem({required this.vente});

  String _formatCurrency(double value) {
    return NumberFormat.currency(
      locale: 'fr_FR',
      symbol: 'Ar',
      decimalDigits: 0,
    ).format(value);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: vente.usageInterne
                  ? Colors.amber.withValues(alpha: 0.1)
                  : AppTheme.success.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              vente.usageInterne ? Icons.business : Icons.shopping_bag,
              color: vente.usageInterne
                  ? Colors.amber.shade700
                  : AppTheme.success,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  vente.produitDesignation,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Row(
                  children: [
                    Text(
                      DateFormat(
                        'HH:mm',
                      ).format(vente.transaction.dateTransaction),
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    if (vente.usageInterne) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 4,
                          vertical: 1,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.amber.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'Interne',
                          style: GoogleFonts.inter(
                            fontSize: 8,
                            fontWeight: FontWeight.bold,
                            color: Colors.amber.shade800,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '×${vente.quantite}',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: AppTheme.textSecondary,
                ),
              ),
              Text(
                _formatCurrency(vente.totalMontant),
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: vente.usageInterne
                      ? AppTheme.textSecondary
                      : AppTheme.textPrimary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Bottom sheet pour créer une vente
class _VenteBottomSheet extends StatefulWidget {
  final Produit produit;
  final VoidCallback onSuccess;
  final Function(String) onError;

  const _VenteBottomSheet({
    required this.produit,
    required this.onSuccess,
    required this.onError,
  });

  @override
  State<_VenteBottomSheet> createState() => _VenteBottomSheetState();
}

class _VenteBottomSheetState extends State<_VenteBottomSheet> {
  final _formKey = GlobalKey<FormState>();
  int _quantite = 1;
  double _remise = 0;
  bool _usageInterne = false;
  bool _isSubmitting = false;

  late TextEditingController _quantiteController;
  late TextEditingController _remiseController;

  @override
  void initState() {
    super.initState();
    _quantiteController = TextEditingController(text: '1');
    _remiseController = TextEditingController(text: '0');
  }

  @override
  void dispose() {
    _quantiteController.dispose();
    _remiseController.dispose();
    super.dispose();
  }

  double get _sousTotal => widget.produit.prixVente * _quantite;
  double get _total =>
      _usageInterne ? 0 : (_sousTotal - _remise).clamp(0, double.infinity);

  String _formatCurrency(double value) {
    return NumberFormat.currency(
      locale: 'fr_FR',
      symbol: 'Ar',
      decimalDigits: 0,
    ).format(value);
  }

  Future<void> _submitVente() async {
    if (!_formKey.currentState!.validate()) return;
    if (_quantite <= 0) return;

    setState(() => _isSubmitting = true);

    final prixUnitaire = _usageInterne ? 0.0 : _total / _quantite;

    final result = await venteProduitService.createVente(
      produitId: widget.produit.id,
      quantite: _quantite,
      prixUnitaire: prixUnitaire,
      usageInterne: _usageInterne,
    );

    setState(() => _isSubmitting = false);

    if (!mounted) return;

    if (result.success) {
      Navigator.pop(context);
      widget.onSuccess();
    } else {
      widget.onError(result.error ?? 'Erreur lors de la vente');
    }
  }

  @override
  Widget build(BuildContext context) {
    return ModernModal(
      title: 'Nouvelle Vente',
      onClose: () => Navigator.pop(context),
      footer: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppTheme.backgroundDark,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Détails (Sous-total / Remise) si pertinents
            if (_remise > 0 && !_usageInterne)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Remise',
                      style: GoogleFonts.inter(
                        color: AppTheme.error,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Text(
                      '-${_formatCurrency(_remise)}',
                      style: GoogleFonts.inter(
                        color: AppTheme.error,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),

            // Ligne Total
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'TOTAL',
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                Text(
                  _formatCurrency(_total),
                  style: GoogleFonts.inter(
                    color: AppTheme.accentBlue,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Bouton Validation
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submitVente,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryBlue,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : Text(
                        _usageInterne ? 'VALIDER (INTERNE)' : 'ENREGISTRER',
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          fontSize: 16,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        child: Form(
          key: _formKey,
          autovalidateMode: AutovalidateMode.onUserInteraction,
          child: Column(
            children: [
              // Produit info
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.primaryBlue.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Produit sélectionné',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primaryBlue,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      widget.produit.designation,
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Prix: ${_formatCurrency(widget.produit.prixVente)} | Stock: ${widget.produit.stock.quantiteActuelle.toInt()} ${widget.produit.uniteMesureSymbole ?? ''}',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppTheme.primaryBlue,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Quantité et Remise
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: ModernTextField(
                      controller: _quantiteController,
                      label: 'Quantité',
                      hint: '1',
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'Requis';
                        if (int.tryParse(v) == 0) return 'Min 1';
                        return null;
                      },
                      onChanged: (v) {
                        if (v.isEmpty) {
                          setState(() => _quantite = 0);
                          return;
                        }
                        final val = int.tryParse(v);
                        if (val != null) {
                          final max = widget.produit.stock.quantiteActuelle
                              .toInt();
                          if (val > max) {
                            setState(() => _quantite = max);
                            _quantiteController.text = max.toString();
                            _quantiteController.selection =
                                TextSelection.fromPosition(
                                  TextPosition(
                                    offset: _quantiteController.text.length,
                                  ),
                                );
                          } else {
                            setState(() => _quantite = val);
                          }
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ModernTextField(
                      controller: _remiseController,
                      label: 'Remise (Ar)',
                      hint: '0',
                      enabled: !_usageInterne,
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      onChanged: (v) {
                        if (v.isEmpty) {
                          setState(() => _remise = 0);
                          return;
                        }
                        final val = double.tryParse(v);
                        if (val != null) {
                          setState(() => _remise = val);
                        }
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Usage interne
              GestureDetector(
                onTap: () => setState(() => _usageInterne = !_usageInterne),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: _usageInterne
                        ? Colors.amber.withValues(alpha: 0.1)
                        : Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _usageInterne
                          ? Colors.amber
                          : Colors.grey.shade300,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.business,
                        color: _usageInterne
                            ? Colors.amber.shade700
                            : AppTheme.textSecondary,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Usage Interne',
                              style: GoogleFonts.inter(
                                fontWeight: FontWeight.bold,
                                color: _usageInterne
                                    ? Colors.amber.shade800
                                    : AppTheme.textPrimary,
                              ),
                            ),
                            Text(
                              'Prix facturé = 0 Ar',
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                color: AppTheme.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Switch(
                        value: _usageInterne,
                        onChanged: (v) => setState(() => _usageInterne = v),
                        activeThumbColor: Colors.amber,
                        activeTrackColor: Colors.amber.withValues(alpha: 0.5),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
